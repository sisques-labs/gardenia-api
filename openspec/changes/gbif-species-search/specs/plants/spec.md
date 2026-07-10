# Delta for Plants

**Change**: `gbif-species-search`
**Issue**: GDN-35
**Base spec**: `openspec/specs/plants/spec.md`

> **Revision note**: an earlier draft of this delta removed
> `Plant.plantSpeciesId` entirely. That is no longer the case — see
> `proposal.md` §6. `Plant.plantSpeciesId` (the FK) and everything about how
> it is read/resolved are UNCHANGED. Only how a client supplies the value
> that becomes `plantSpeciesId` changes.

---

## MODIFIED Requirements

### Requirement: IPlantSpeciesPort Contract

The `plants` bounded context MUST define `IPlantSpeciesPort` in
`plants/application/ports/` and `PlantSpeciesViewModel` in
`plants/domain/view-models/`. No file under `plants/application/` or
`plants/domain/` MAY import from `@contexts/plant-species/`.

`IPlantSpeciesPort` MUST expose:
- `findByPlantSpeciesId(plantSpeciesId: string): Promise<PlantSpeciesViewModel | null>`
- `findOrCreateByGbifKey(gbifKey: number, scientificName: string): Promise<{ id: string }>`
  (new)

`PlantSpeciesViewModel` MUST carry: `id: string`, `scientificName: string`,
`gbifKey: number | null`, `createdAt: Date`, `updatedAt: Date`.

(Previously: `PlantSpeciesViewModel` carried `name: string` — later
`scientificName`, `description`, `imageUrl` per `plant-species-enrich`; the
port exposed only `findByPlantSpeciesId`.)

#### Scenario: Resolve a species by id (unchanged)

- GIVEN a plant with `plantSpeciesId` set
- WHEN `IPlantSpeciesPort.findByPlantSpeciesId` is called
- THEN it returns a `PlantSpeciesViewModel` with `scientificName`/`gbifKey`
  populated

#### Scenario: Find-or-create resolves a live search pick to a catalog id

- GIVEN a client has `{ gbifKey: 2882337, scientificName: "Monstera
  deliciosa" }` from a live GBIF search result (no local id)
- WHEN `IPlantSpeciesPort.findOrCreateByGbifKey(2882337, "Monstera
  deliciosa")` is called
- THEN it returns a catalog `id` — created if this is the first pick of that
  `gbifKey`, or reused if a catalog entry already exists for it

---

### Requirement: Plant Species Link Fields

The `PlantAggregate`, `IPlantPrimitives`, and plant persistence entity MUST
continue to carry `plantSpeciesId` (UUID string or null) exactly as before —
**this field and its persistence are unchanged by this delta**.

`PlantViewModel` MUST continue to expose `plantSpeciesId: string | null` and
`species: PlantSpeciesViewModel | null` (the nested `species` object is
enrichment-only, resolved at read time, and MUST NOT be persisted in
primitives or the TypeORM entity — unchanged). `PlantSpeciesViewModel`'s
shape is trimmed per the `plant-species` delta in this same change
(`scientificName`/`gbifKey`, no `description`/`imageUrl`).

Create and update plant commands MUST accept optional `gbifSpeciesKey`
(number) and `speciesScientificName` (string) — **not** a raw
`plantSpeciesId` — since the client only ever has a GBIF search pick, never a
local catalog id. Both MUST be supplied together or neither.

When both are provided, the handler MUST resolve them to a `plantSpeciesId`
via `IPlantSpeciesPort.findOrCreateByGbifKey` before persisting — this
REPLACES the previous "verify the catalog entry exists" check, since the
catalog entry may not exist yet and is now created on demand.

(Previously: commands accepted `plantSpeciesId` directly and verified it
existed in the catalog before persisting, throwing
`PlantLinkedSpeciesNotFoundException` if absent.)

#### Scenario: Create plant with a species pick

- GIVEN an authenticated user with a live search pick
  `{ gbifSpeciesKey: 2882337, speciesScientificName: "Monstera deliciosa" }`
- WHEN `CreatePlant` is dispatched with those two fields
- THEN `plantSpeciesId` is set to the catalog id resolved (created or reused)
  by `findOrCreateByGbifKey`, and `PlantViewModel.species` resolves to
  `{ scientificName: "Monstera deliciosa", gbifKey: 2882337, ... }`

#### Scenario: Create plant without a species pick

- GIVEN an authenticated user
- WHEN `CreatePlant` is dispatched with `gbifSpeciesKey`/`speciesScientificName`
  both omitted
- THEN `plantSpeciesId` is `null` and `species` resolves to `null`

#### Scenario: Read plant with no species (unchanged)

- GIVEN a plant with `plantSpeciesId` null
- WHEN `PlantFindById` is dispatched
- THEN `PlantViewModel.plantSpeciesId` is null and `species` is null

---

### Requirement: CreatePlant Command

The system MUST allow an authenticated user to create a plant.

The command MUST accept `name` (required), `gbifSpeciesKey` (optional,
positive integer, paired with `speciesScientificName`),
`speciesScientificName` (optional, paired with `gbifSpeciesKey`), `imageUrl`
(optional), and `userId` (from `@CurrentUser`). `spaceId` MUST be sourced from
`SpaceContext` ALS — never from the request payload.

When both species fields are provided, the handler MUST resolve them to a
`plantSpeciesId` via `findOrCreateByGbifKey` before persisting (see above) —
it MUST NOT throw a not-found error for an unrecognized `gbifSpeciesKey`,
since find-or-create always succeeds.

(Previously: accepted `plantSpeciesId` (optional) and threw
`PlantLinkedSpeciesNotFoundException` if it didn't already exist in the
catalog.)

#### Scenario: Create plant with a never-before-seen species

- GIVEN an authenticated user
- WHEN `CreatePlant` is dispatched with a `gbifSpeciesKey` that has never
  been linked before
- THEN the plant is created successfully, with a new catalog row created as
  a side effect (not an error)
