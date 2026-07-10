# Delta for Plant Species

**Change**: `gbif-species-search`
**Issue**: GDN-35
**Base spec**: `openspec/specs/plant-species/spec.md` (as amended by
`plant-species-enrich`, not yet re-archived at time of writing — this delta
applies against the enriched shape: `scientificName`, `description`,
`imageUrl`)

---

## REMOVED Requirements

### Requirement: Per-Field Domain Events on Update
**Reason**: (added by `plant-species-enrich`) `description`/`imageUrl` fields
and their changed-events are removed; only `scientificName`- and
`gbifKey`-changed events remain (see ADDED section).

### Requirement: Value Objects for New Fields
**Reason**: (added by `plant-species-enrich`)
`PlantSpeciesDescriptionValueObject`/`PlantSpeciesImageUrlValueObject` are
removed along with the fields they backed.

---

## MODIFIED Requirements

### Requirement: PlantSpeciesAggregate Fields and Validation

The PlantSpeciesAggregate MUST carry: `id` (UUID, generated), `scientificName`
(non-empty trimmed string, required, max 300 chars), `gbifKey` (positive
integer, required on new writes; MAY be `null` only on rows persisted before
this change), `createdAt`, `updatedAt`.

The aggregate MUST NOT carry `spaceId`, `description`, or `imageUrl`.

The system MUST reject creation when `scientificName` is empty/whitespace-only
after trim, or when `gbifKey` is not a positive integer.

(Previously: carried `description` (nullable, max 2000) and `imageUrl`
(nullable, max 500) in addition to `scientificName`; no `gbifKey` field.)

#### Scenario: Valid catalog entry

- GIVEN a non-empty trimmed scientificName and a positive integer gbifKey
- WHEN a PlantSpeciesAggregate is built
- THEN both fields are set and the aggregate is valid

#### Scenario: Empty scientificName rejected

- GIVEN an empty or whitespace-only scientificName
- WHEN PlantSpeciesAggregate is built
- THEN a domain validation error is thrown

#### Scenario: Non-positive gbifKey rejected

- GIVEN `gbifKey: 0` or a negative number
- WHEN PlantSpeciesAggregate is built (on a write path requiring gbifKey)
- THEN a domain validation error is thrown

---

### Requirement: Globally Unique Species Identity

The system MUST enforce that no two catalog entries share the same
non-null `gbifKey`. `scientificName` uniqueness is NOT enforced (dropped).

On duplicate `gbifKey` via the manual create path, the system MUST throw
`PlantSpeciesGbifKeyAlreadyExistsException` and return HTTP 409 Conflict. The
`FindOrCreatePlantSpeciesByGbifKey` path (see ADDED section) MUST NOT throw
on an existing `gbifKey` — it returns the existing row's id instead.

(Previously: uniqueness enforced case-insensitively on `scientificName`,
via `PlantSpeciesNameAlreadyExistsException`.)

#### Scenario: Manual create with duplicate gbifKey rejected

- GIVEN an existing catalog entry with `gbifKey: 3152358`
- WHEN `CreatePlantSpecies` is dispatched with `gbifKey: 3152358` (any
  scientificName)
- THEN `PlantSpeciesGbifKeyAlreadyExistsException` is thrown and 409 is
  returned

#### Scenario: Two entries may share a scientificName

- GIVEN an existing catalog entry with `scientificName: "Ficus lyrata"` and a
  different `gbifKey`
- WHEN `CreatePlantSpecies` is dispatched with the same `scientificName` and a
  new, different `gbifKey`
- THEN the entry is persisted without error

---

### Requirement: CreatePlantSpecies Command

The system MUST allow any authenticated user to create a catalog entry
directly (manual path, alongside `FindOrCreatePlantSpeciesByGbifKey` — see
ADDED section).

The command MUST accept `scientificName` (required) and `gbifKey` (required,
positive integer). The handler MUST NOT read `spaceId` from `SpaceContext`.

On success the handler MUST emit `PlantSpeciesCreated` and return the new id.

(Previously: accepted `scientificName` required, `description`/`imageUrl`
optional; no `gbifKey`.)

#### Scenario: Happy path

- GIVEN an authenticated user
- WHEN `CreatePlantSpecies` is dispatched with a unique `gbifKey` and a
  `scientificName`
- THEN a PlantSpeciesAggregate is persisted and `PlantSpeciesCreated` is
  emitted

---

### Requirement: UpdatePlantSpecies Command

The system MUST allow any authenticated user to update a catalog entry's
`scientificName` and/or `gbifKey` (both optional on update).

On success the handler MUST emit `PlantSpeciesUpdated` plus one `*Changed`
event per field that actually changed.

(Previously: also accepted `description`/`imageUrl`.)

#### Scenario: Update gbifKey

- GIVEN an existing catalog entry
- WHEN `UpdatePlantSpecies` is dispatched with a new, unique `gbifKey`
- THEN the entry is updated, `PlantSpeciesGbifKeyChangedEvent` is emitted,
  and `PlantSpeciesUpdated` is emitted

#### Scenario: Update to conflicting gbifKey rejected

- GIVEN catalog entries A (`gbifKey: 111`) and B (`gbifKey: 222`)
- WHEN `UpdatePlantSpecies` is dispatched for B with `gbifKey: 111`
- THEN `PlantSpeciesGbifKeyAlreadyExistsException` is thrown and 409 is
  returned

---

### Requirement: No Tenant Repository for Catalog

Read and write repository access for plant-species MUST use standard TypeORM
repositories without `createTenantRepository`.

The `plant_species` table MUST NOT include a `space_id`, `description`, or
`image_url` column. It MUST include a nullable `gbif_key` column with a
partial unique index (`WHERE gbif_key IS NOT NULL`).

(Previously: included nullable `description`/`image_url` columns; no
`gbif_key`.)

#### Scenario: Catalog row has trimmed fields

- GIVEN a persisted catalog entry
- WHEN the row is read from the database
- THEN only `id`, `scientific_name`, `gbif_key`, and timestamps are present

#### Scenario: Legacy row with null gbif_key

- GIVEN a catalog row created before this change (no `gbif_key` captured)
- WHEN the row is read
- THEN `gbif_key` is `null` and the row remains otherwise valid/readable

---

### Requirement: REST Transport

The system MUST expose plant-species CRUD via REST, trimmed to
`scientificName`/`gbifKey`, plus the new search endpoint (see ADDED section).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/plant-species` | Create |
| GET | `/plant-species` | List (paginated) |
| GET | `/plant-species/:id` | Fetch by id |
| PATCH | `/plant-species/:id` | Update |
| DELETE | `/plant-species/:id` | Delete |
| GET | `/plant-species/search` | Live GBIF search (new — see ADDED) |

Enrich and import endpoints are REMOVED.

(Previously: request/response DTOs also exposed `description`/`imageUrl`;
enrich (`PATCH .../:id/enrich` or equivalent mutation-only surface) and
import endpoints existed.)

#### Scenario: REST create with trimmed fields

- GIVEN valid JWT
- WHEN POST `/plant-species` with `{ "scientificName": "Basil", "gbifKey":
  123456 }`
- THEN 201 is returned with the created entry (no description/imageUrl in
  the response)

---

### Requirement: GraphQL Transport

The system MUST expose plant-species CRUD via GraphQL with parity to REST,
trimmed to `scientificName`/`gbifKey`, plus the new search query.

Mutations MUST include create, update, and delete. `enrichPlantSpecies` and
`importPlantSpeciesFromGbif` mutations are REMOVED.

(Previously: also exposed `description`/`imageUrl`; included
`enrichPlantSpecies` and `importPlantSpeciesFromGbif`.)

#### Scenario: GraphQL create mutation with trimmed fields

- GIVEN valid JWT in GraphQL context
- WHEN `createPlantSpecies` mutation is executed with `scientificName` and
  `gbifKey`
- THEN the created `PlantSpecies` object is returned with both fields (no
  `description`/`imageUrl`)

---

## ADDED Requirements

### Requirement: GbifSpeciesSearch Query (live, non-persisting)

The system MUST expose a `GbifSpeciesSearchQuery` accepting `name` (required,
non-empty) and `limit` (optional, default 10, clamped to max 20).

The handler MUST call `IGbifSpeciesSearchPort.suggest(name, limit)`
(implemented by `GbifSpeciesSuggestAdapter`, proxying GBIF's
`GET /v1/species/suggest`) and return the result unmodified as
`{ gbifKey: number; scientificName: string }[]`.

The system MUST NOT persist, cache, or store the query input or its result
anywhere.

On any adapter failure (timeout, network error, non-2xx, malformed payload),
the query MUST return `[]`, never throw.

Transport parity: exposed via GraphQL query, REST (`GET
/plant-species/search`), and MCP tool, all JWT-authenticated only (no
`X-Space-ID`), all dispatching via `QueryBus` only. This query is explicitly
EXEMPT from the mandatory `Criteria`/`findByCriteria` filter pattern — it is
a live external passthrough, not a persisted list.

#### Scenario: Search returns live GBIF matches

- GIVEN GBIF's `/species/suggest` returns matches for "Monstera"
- WHEN `GbifSpeciesSearchQuery` is dispatched with `name: "Monstera"`
- THEN a list of `{ gbifKey, scientificName }` is returned, sourced entirely
  from the live GBIF response — nothing is written to the database

#### Scenario: GBIF timeout does not crash the flow

- GIVEN GBIF's `/species/suggest` does not respond within 5 seconds
- WHEN the query is dispatched
- THEN `[]` is returned and a warning is logged, without throwing

---

### Requirement: FindOrCreatePlantSpeciesByGbifKey Command

The system MUST expose a `FindOrCreatePlantSpeciesByGbifKeyCommand` accepting
`gbifKey` (required, positive integer) and `scientificName` (required,
non-empty).

The handler MUST: look up an existing catalog row by `gbifKey`; if found,
return its `id` without modification; if not found, create a new catalog row
with the given `gbifKey`/`scientificName`, emit `PlantSpeciesCreated`, and
return the new `id`.

This command MUST NOT throw `PlantSpeciesGbifKeyAlreadyExistsException` on a
match — a match is the expected "reuse" outcome, not a conflict.

This command is the mechanism `plants` uses to resolve a live search pick
into a linkable catalog id (see the `plants` delta in this same change).

#### Scenario: First pick of a species creates the catalog row

- GIVEN no catalog entry with `gbifKey: 2882337`
- WHEN `FindOrCreatePlantSpeciesByGbifKey` is dispatched with `gbifKey:
  2882337, scientificName: "Monstera deliciosa"`
- THEN a new catalog row is created, `PlantSpeciesCreated` is emitted, and its
  `id` is returned

#### Scenario: Subsequent pick of the same species reuses the row

- GIVEN an existing catalog entry with `gbifKey: 2882337`
- WHEN `FindOrCreatePlantSpeciesByGbifKey` is dispatched again with the same
  `gbifKey` (any scientificName)
- THEN no new row is created; the existing entry's `id` is returned; no
  domain event is emitted

---

### Requirement: PlantSpeciesGbifKeyValueObject

The domain MUST expose `PlantSpeciesGbifKeyValueObject` (extends
`NumberValueObject`), validating a positive integer. It MUST be used
wherever an aggregate write path requires a `gbifKey`.

#### Scenario: Valid gbifKey VO

- GIVEN a positive integer
- WHEN `PlantSpeciesGbifKeyValueObject` is constructed
- THEN it wraps the value successfully

#### Scenario: Zero or negative gbifKey rejected

- GIVEN `0` or a negative integer
- WHEN `PlantSpeciesGbifKeyValueObject` is constructed
- THEN a domain validation error is thrown
