# Delta for Plant Species

**Change**: `plant-species-enrich`
**Issue**: #172
**Base spec**: `openspec/specs/plant-species/spec.md`

---

## MODIFIED Requirements

### Requirement: PlantSpeciesAggregate Fields and Validation

The PlantSpeciesAggregate MUST carry: `id` (UUID, generated), `scientificName` (non-empty trimmed string, required, UNIQUE, max 300 chars), `description` (nullable string, max 2000 chars), `imageUrl` (nullable string, max 500 chars), `createdAt`, `updatedAt`.

The aggregate MUST NOT carry `spaceId`.

The system MUST reject creation when `scientificName` is empty or whitespace-only after trim.

The system MUST NOT enforce uniqueness or non-null on `description` or `imageUrl`.

(Previously: aggregate carried `name` (max 200 chars); no `description` or `imageUrl` fields.)

#### Scenario: Valid catalog entry — all fields

- GIVEN a non-empty trimmed scientificName, a description, and an imageUrl
- WHEN a PlantSpeciesAggregate is built
- THEN all fields are set and the aggregate is valid

#### Scenario: Valid catalog entry — optional fields absent

- GIVEN a non-empty trimmed scientificName with no description or imageUrl
- WHEN a PlantSpeciesAggregate is built
- THEN the aggregate is valid with description and imageUrl as null

#### Scenario: Empty scientificName rejected

- GIVEN an empty or whitespace-only scientificName
- WHEN PlantSpeciesAggregate is built
- THEN a domain validation error is thrown

#### Scenario: scientificName exceeds 300 chars rejected

- GIVEN a scientificName string longer than 300 characters
- WHEN PlantSpeciesAggregate is built
- THEN a domain validation error is thrown

#### Scenario: description exceeds 2000 chars rejected

- GIVEN a description string longer than 2000 characters
- WHEN PlantSpeciesAggregate is built
- THEN a domain validation error is thrown

#### Scenario: imageUrl exceeds 500 chars rejected

- GIVEN an imageUrl string longer than 500 characters
- WHEN PlantSpeciesAggregate is built
- THEN a domain validation error is thrown

---

### Requirement: Globally Unique Species Name

The system MUST enforce that no two catalog entries share the same `scientificName` when compared case-insensitively after trim, across the entire platform.

On duplicate the system MUST throw `PlantSpeciesNameAlreadyExistsException` and return HTTP 409 Conflict.

(Previously: uniqueness enforced on `name` field — same semantics, field renamed to `scientificName`.)

#### Scenario: Create with unique scientificName

- GIVEN no catalog entry with scientificName "Monstera deliciosa" (any casing)
- WHEN CreatePlantSpecies is dispatched with scientificName "Monstera deliciosa"
- THEN the entry is persisted

#### Scenario: Create with duplicate scientificName — case insensitive

- GIVEN an existing catalog entry with scientificName "monstera deliciosa"
- WHEN CreatePlantSpecies is dispatched with scientificName "Monstera Deliciosa"
- THEN PlantSpeciesNameAlreadyExistsException is thrown and 409 is returned

#### Scenario: Update to conflicting scientificName rejected

- GIVEN catalog entries "Rosa canina" (id A) and "Tulipa gesneriana" (id B)
- WHEN UpdatePlantSpecies is dispatched for id B with scientificName "rosa canina"
- THEN PlantSpeciesNameAlreadyExistsException is thrown and 409 is returned

---

### Requirement: CreatePlantSpecies Command

The system MUST allow any authenticated user to create a catalog entry.

The command MUST accept `scientificName` (required), `description` (optional, nullable), and `imageUrl` (optional, nullable). The handler MUST NOT read `spaceId` from `SpaceContext`.

On success the handler MUST emit `PlantSpeciesCreated` and return the new id.

(Previously: command accepted `name` only — renamed to `scientificName`; `description` and `imageUrl` added as optional.)

#### Scenario: Happy path — scientificName only

- GIVEN an authenticated user
- WHEN CreatePlantSpecies is dispatched with a valid unique scientificName
- THEN a PlantSpeciesAggregate is persisted and PlantSpeciesCreated is emitted

#### Scenario: Happy path — all fields

- GIVEN an authenticated user
- WHEN CreatePlantSpecies is dispatched with scientificName, description, and imageUrl
- THEN a PlantSpeciesAggregate is persisted with all fields set and PlantSpeciesCreated is emitted

---

### Requirement: UpdatePlantSpecies Command

The system MUST allow any authenticated user to update a catalog entry.

The command MAY update `scientificName` (optional), `description` (optional, nullable), or `imageUrl` (optional, nullable). On success the handler MUST emit `PlantSpeciesUpdated` plus one `*Changed` domain event per field that actually changed.

(Previously: command MAY update `name` only — renamed to `scientificName`; `description` and `imageUrl` added as optional inputs; per-field changed events added.)

#### Scenario: Update scientificName

- GIVEN an existing catalog entry
- WHEN UpdatePlantSpecies is dispatched with a new globally unique scientificName
- THEN the entry is updated, PlantSpeciesNameChangedEvent is emitted, and PlantSpeciesUpdated is emitted

#### Scenario: Update description only

- GIVEN an existing catalog entry
- WHEN UpdatePlantSpecies is dispatched with a new description and no other changes
- THEN the entry is updated, PlantSpeciesDescriptionChangedEvent is emitted, and PlantSpeciesUpdated is emitted

#### Scenario: Update imageUrl only

- GIVEN an existing catalog entry
- WHEN UpdatePlantSpecies is dispatched with a new imageUrl and no other changes
- THEN the entry is updated, PlantSpeciesImageUrlChangedEvent is emitted, and PlantSpeciesUpdated is emitted

#### Scenario: Entry not found

- GIVEN a plantSpeciesId that does not exist
- WHEN UpdatePlantSpecies is dispatched
- THEN PlantSpeciesNotFoundException is thrown and 404 is returned

---

### Requirement: No Tenant Repository for Catalog

Read and write repository access for plant-species MUST use standard TypeORM repositories without `createTenantRepository`.

The `plant_species` table MUST NOT include a `space_id` column.

The `plant_species` table MUST include columns: `id`, `scientific_name` (NOT NULL, UNIQUE, VARCHAR(300)), `description` (NULL, VARCHAR(2000)), `image_url` (NULL, VARCHAR(500)), `created_at`, `updated_at`.

(Previously: table had `name` VARCHAR(200) NOT NULL UNIQUE; column renamed to `scientific_name` with max 300; `description` and `image_url` added as nullable.)

#### Scenario: Catalog row has enriched fields

- GIVEN a persisted catalog entry with all fields
- WHEN the row is read from the database
- THEN `id`, `scientific_name`, `description`, `image_url`, and timestamps are present

#### Scenario: Catalog row with optional fields absent

- GIVEN a persisted catalog entry created without description or imageUrl
- WHEN the row is read from the database
- THEN `description` and `image_url` are NULL

---

### Requirement: REST Transport

The system MUST expose plant-species CRUD via REST.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/plant-species` | Create |
| GET | `/plant-species` | List (paginated) |
| GET | `/plant-species/:id` | Fetch by id |
| PATCH | `/plant-species/:id` | Update |
| DELETE | `/plant-species/:id` | Delete |

All endpoints MUST require JWT authentication only.

Request DTOs for create and update MUST expose `scientificName` (required on create), `description` (optional), `imageUrl` (optional).

Response DTOs MUST expose `scientificName`, `description`, and `imageUrl`.

Transport MUST dispatch via `CommandBus` and `QueryBus`.

(Previously: request/response DTOs exposed `name` only — renamed to `scientificName`; `description` and `imageUrl` added.)

#### Scenario: REST create with all fields

- GIVEN valid JWT
- WHEN POST `/plant-species` with `{ "scientificName": "Basil", "description": "Herb", "imageUrl": "https://..." }`
- THEN 201 is returned with the created entry including all three fields

#### Scenario: REST create without optional fields

- GIVEN valid JWT
- WHEN POST `/plant-species` with `{ "scientificName": "Basil" }`
- THEN 201 is returned with `description` and `imageUrl` as null

---

### Requirement: GraphQL Transport

The system MUST expose plant-species CRUD via GraphQL with parity to REST.

Queries MUST include fetch-by-id and paginated list. Mutations MUST include create, update, and delete.

Request input types for create and update MUST expose `scientificName` (required on create), `description` (nullable), `imageUrl` (nullable).

Response types MUST expose `scientificName`, `description`, and `imageUrl`.

Resolvers MUST use `CommandBus` / `QueryBus` only.

(Previously: input/response types exposed `name` only — renamed to `scientificName`; `description` and `imageUrl` added.)

#### Scenario: GraphQL create mutation with all fields

- GIVEN valid JWT in GraphQL context
- WHEN `createPlantSpecies` mutation is executed with scientificName, description, and imageUrl
- THEN the created `PlantSpecies` object is returned with all three fields

#### Scenario: GraphQL list query returns enriched fields

- GIVEN valid JWT and catalog entries with scientificName, description, and imageUrl
- WHEN `plantSpeciesList` query is executed
- THEN paginated entries include scientificName, description, and imageUrl per item

---

## ADDED Requirements

### Requirement: Per-Field Domain Events on Update

When UpdatePlantSpecies changes a field, the aggregate MUST emit one `*Changed` event per changed field in addition to the umbrella `PlantSpeciesUpdated` event.

Events MUST be: `PlantSpeciesNameChangedEvent` (existing), `PlantSpeciesDescriptionChangedEvent` (new), `PlantSpeciesImageUrlChangedEvent` (new). Event payload MUST conform to `IPlantSpeciesEventData` (which mirrors `IPlantSpeciesPrimitives`).

No `*Changed` events are emitted at create time; only `PlantSpeciesCreated` is emitted.

#### Scenario: Multiple fields changed

- GIVEN an existing catalog entry
- WHEN UpdatePlantSpecies changes scientificName, description, and imageUrl simultaneously
- THEN three field-changed events are emitted plus one PlantSpeciesUpdated

#### Scenario: No fields changed

- GIVEN an existing catalog entry
- WHEN UpdatePlantSpecies is dispatched with no changed values
- THEN no field-changed events are emitted (PlantSpeciesUpdated MAY still be emitted)

#### Scenario: Create emits no field-changed events

- GIVEN no prior catalog entry
- WHEN CreatePlantSpecies is dispatched
- THEN only PlantSpeciesCreated is emitted — no field-changed events

---

### Requirement: Database Migration — Rename + Add Columns

The system MUST apply a single backward-compatible migration that:
1. Renames column `name` → `scientific_name`, VARCHAR(300), NOT NULL, UNIQUE.
2. ADDs column `description` VARCHAR(2000) DEFAULT NULL.
3. ADDs column `image_url` VARCHAR(500) DEFAULT NULL.

The migration MUST NOT delete or transform existing data.

#### Scenario: Migration applied to populated table

- GIVEN a `plant_species` table with existing rows using `name`
- WHEN the migration runs
- THEN all existing rows have `scientific_name` equal to the previous `name` value, and `description` / `image_url` are NULL

#### Scenario: Migration rollback

- GIVEN the migration has been applied
- WHEN the migration is rolled back
- THEN `scientific_name` is renamed back to `name` (VARCHAR(200)) and `description` / `image_url` columns are dropped

---

### Requirement: UpdatePlantSpecies Handler Unit Test

A unit test file `update-plant-species.handler.spec.ts` MUST exist and cover the update command handler.

The test MUST cover: successful update (name only), successful update (all three fields), entry-not-found (PlantSpeciesNotFoundException), and duplicate-name (PlantSpeciesNameAlreadyExistsException).

Tests MUST use `jest.Mocked<T>` pattern — no `@nestjs/testing`.

#### Scenario: Handler test covers happy path

- GIVEN a mock write repository and mock assert services
- WHEN the handler dispatches with valid input
- THEN the aggregate is saved and PlantSpeciesUpdated is emitted

#### Scenario: Handler test covers not-found

- GIVEN a mock assert service that throws PlantSpeciesNotFoundException
- WHEN the handler dispatches
- THEN the exception propagates

---

### Requirement: Value Objects for New Fields

The domain MUST expose three new value objects: `PlantSpeciesScientificNameValueObject` (extends `StringValueObject`, NOT NULL, max 300 chars), `PlantSpeciesDescriptionValueObject` (extends `StringValueObject`, nullable, max 2000 chars), `PlantSpeciesImageUrlValueObject` (extends `StringValueObject`, nullable, max 500 chars).

Each VO MUST validate its length constraint and throw a domain error when violated.

#### Scenario: Valid scientificName VO

- GIVEN a string of 1–300 characters
- WHEN PlantSpeciesScientificNameValueObject is constructed
- THEN it wraps the value successfully

#### Scenario: Nullable description VO with null input

- GIVEN a null value
- WHEN PlantSpeciesDescriptionValueObject is constructed
- THEN it wraps null without throwing
