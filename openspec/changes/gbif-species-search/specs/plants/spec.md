# Delta for Plants

**Change**: `gbif-species-search`
**Issue**: GDN-35
**Base spec**: `openspec/specs/plants/spec.md`

---

## REMOVED Requirements

### Requirement: IPlantSpeciesPort Contract
**Reason**: the `plant-species` catalog this port looked up is deleted; there
is nothing left to resolve via a cross-context call.

### Requirement: EnrichPlantWithSpeciesService
**Reason**: superseded — `speciesScientificName` is now a plain field already
present on `PlantViewModel`, no read-side enrichment/lookup needed.

---

## MODIFIED Requirements

### Requirement: Plant Species Link Fields

The `PlantAggregate`, `IPlantPrimitives`, and plant persistence entity MUST
support two optional, independent fields: `gbifSpeciesKey` (positive integer
or null — GBIF's `usageKey`) and `speciesScientificName` (string, max 300
chars, or null).

Neither field references a local table. There MUST be no foreign key, no
local "species" table, and no existence check against any catalog when either
field is set.

`PlantViewModel` MUST expose `gbifSpeciesKey: number | null` and
`speciesScientificName: string | null` as plain scalar fields — no nested
resolved `species` object.

Plant REST and GraphQL read responses MUST include `gbifSpeciesKey` and
`speciesScientificName` as plain fields (not a resolved/joined sub-object).

Create and update plant commands MUST accept optional `gbifSpeciesKey` and
`speciesScientificName` together or independently, and MUST NOT perform any
lookup (local or external) to validate them before persisting.

(Previously: a single `plantSpeciesId` UUID FK into the `plant-species`
catalog, resolved at read time into a nested `species` object via
`IPlantSpeciesPort`; existence was validated against the catalog on write.)

#### Scenario: Create plant with species fields

- GIVEN an authenticated user
- WHEN `CreatePlant` is dispatched with `gbifSpeciesKey: 3152358` and
  `speciesScientificName: "Monstera deliciosa"`
- THEN the plant is persisted with both fields set, with no external or
  cross-context call made to validate them

#### Scenario: Create plant without species fields

- GIVEN an authenticated user
- WHEN `CreatePlant` is dispatched with `gbifSpeciesKey` and
  `speciesScientificName` both omitted
- THEN the plant is persisted with both fields `null`

#### Scenario: Read plant exposes plain species fields

- GIVEN a plant with `gbifSpeciesKey` and `speciesScientificName` set
- WHEN the plant is fetched via REST or GraphQL
- THEN the response includes `gbifSpeciesKey` and `speciesScientificName` as
  top-level scalar fields, with no nested `species` object

#### Scenario: Update plant species fields independently

- GIVEN an existing plant with `speciesScientificName: "Ficus lyrata"` and no
  `gbifSpeciesKey`
- WHEN `UpdatePlant` is dispatched with `gbifSpeciesKey: 2882316` only
- THEN the plant has both `gbifSpeciesKey: 2882316` and the unchanged
  `speciesScientificName: "Ficus lyrata"`

---

### Requirement: CreatePlant Command

The system MUST allow an authenticated user to create a plant.

The command MUST accept `name` (required), `gbifSpeciesKey` (optional,
positive integer), `speciesScientificName` (optional, string, max 300),
`imageUrl` (optional), and `userId` (from `@CurrentUser`). `spaceId` MUST be
sourced from `SpaceContext` ALS — never from the request payload.

The handler MUST NOT perform any lookup to validate `gbifSpeciesKey` or
`speciesScientificName` before persisting.

(Previously: accepted `plantSpeciesId` (optional) and verified it existed in
the `plant-species` catalog before persisting.)

#### Scenario: Create plant with a chosen species

- GIVEN an authenticated user
- WHEN `CreatePlant` is dispatched with `gbifSpeciesKey` and
  `speciesScientificName` set
- THEN the plant is created immediately, with no external validation call

---

## ADDED Requirements

### Requirement: Value Objects for Plant Species Fields

The `plants` domain MUST expose two new value objects:
`PlantGbifSpeciesKeyValueObject` (extends `NumberValueObject`, nullable,
integer, positive) and `PlantSpeciesScientificNameValueObject` (extends
`StringValueObject`, nullable, max 300 chars, trimmed).

These are local to the `plants` context — they are NOT shared with, or
imported from, any other context.

#### Scenario: Valid gbifSpeciesKey VO

- GIVEN a positive integer
- WHEN `PlantGbifSpeciesKeyValueObject` is constructed
- THEN it wraps the value successfully

#### Scenario: Null gbifSpeciesKey VO

- GIVEN a null value
- WHEN `PlantGbifSpeciesKeyValueObject` is constructed
- THEN it wraps null without throwing

#### Scenario: scientificName exceeds 300 chars rejected

- GIVEN a string longer than 300 characters
- WHEN `PlantSpeciesScientificNameValueObject` is constructed
- THEN a domain validation error is thrown

---

### Requirement: Migration Backfills Species Name Before Dropping the Catalog

A single migration MUST, in order: (1) add `plants.gbif_species_key` and
`plants.species_scientific_name` as nullable columns, (2) backfill
`species_scientific_name` from the current `plant_species.scientific_name`
for every plant with a non-null `plant_species_id`, (3) drop the
`plant_species_id` column (and its FK constraint) from `plants`, (4) drop the
`plant_species` table.

`gbif_species_key` MUST NOT be backfilled from any existing data (no source
column exists for it) — it MUST start `null` for all pre-existing plants.

#### Scenario: Backfill preserves the chosen species name

- GIVEN a plant linked to a catalog entry with `scientific_name = "Monstera
  deliciosa"`
- WHEN the migration runs
- THEN the plant's `species_scientific_name` is `"Monstera deliciosa"` and
  `gbif_species_key` is `null`

#### Scenario: Migration rollback restores schema only

- GIVEN the migration has been applied
- WHEN the migration is rolled back
- THEN `plant_species` exists again as an empty table matching its pre-drop
  shape, and `plants.plant_species_id` is re-added as nullable — but no
  catalog data or FK linkage is restored
