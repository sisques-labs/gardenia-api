# Plant Species Specification (Delta — ADDED)

## Purpose

Global platform catalog of species names (`plant-species` bounded context). v1: name-only CRUD via REST and GraphQL. Names are **globally unique** (case-insensitive). No tenant/`spaceId` on catalog rows.

## ADDED Requirements

### Requirement: PlantSpeciesAggregate Fields and Validation

The PlantSpeciesAggregate MUST carry: `id` (UUID, generated), `name` (non-empty trimmed string, required, max 200 chars), `createdAt`, `updatedAt`.

The aggregate MUST NOT carry `spaceId`.

The system MUST reject creation when `name` is empty or whitespace-only after trim.

#### Scenario: Valid catalog entry

- GIVEN a non-empty trimmed name
- WHEN a PlantSpeciesAggregate is built
- THEN all fields are set and the aggregate is valid

#### Scenario: Empty name rejected

- GIVEN an empty or whitespace-only name
- WHEN PlantSpeciesAggregate is built
- THEN a domain validation error is thrown

---

### Requirement: Globally Unique Species Name

The system MUST enforce that no two catalog entries share the same name when compared case-insensitively after trim, across the entire platform.

On duplicate the system MUST throw `PlantSpeciesNameAlreadyExistsException` and return HTTP 409 Conflict.

#### Scenario: Create with unique name

- GIVEN no catalog entry named "Monstera" (any casing)
- WHEN CreatePlantSpecies is dispatched with name "Monstera"
- THEN the entry is persisted

#### Scenario: Create with duplicate name — case insensitive

- GIVEN an existing catalog entry named "monstera"
- WHEN CreatePlantSpecies is dispatched with name "Monstera"
- THEN PlantSpeciesNameAlreadyExistsException is thrown and 409 is returned

#### Scenario: Update to conflicting name rejected

- GIVEN catalog entries "Rose" (id A) and "Tulip" (id B)
- WHEN UpdatePlantSpecies is dispatched for id B with name "rose"
- THEN PlantSpeciesNameAlreadyExistsException is thrown and 409 is returned

---

### Requirement: CreatePlantSpecies Command

The system MUST allow any authenticated user to create a catalog entry.

The command MUST accept `name` (required). The handler MUST NOT read `spaceId` from `SpaceContext`.

On success the handler MUST emit `PlantSpeciesCreated` and return the new id.

#### Scenario: Happy path

- GIVEN an authenticated user
- WHEN CreatePlantSpecies is dispatched with a valid unique name
- THEN a PlantSpeciesAggregate is persisted and PlantSpeciesCreated is emitted

---

### Requirement: UpdatePlantSpecies Command

The system MUST allow any authenticated user to update a catalog entry.

The command MAY update `name` (optional). On success the handler MUST emit `PlantSpeciesUpdated`.

#### Scenario: Update name

- GIVEN an existing catalog entry
- WHEN UpdatePlantSpecies is dispatched with a new globally unique name
- THEN the entry is updated and PlantSpeciesUpdated is emitted

#### Scenario: Entry not found

- GIVEN a plantSpeciesId that does not exist
- WHEN UpdatePlantSpecies is dispatched
- THEN PlantSpeciesNotFoundException is thrown and 404 is returned

---

### Requirement: DeletePlantSpecies Command

The system MUST allow any authenticated user to delete a catalog entry only when no plant references it.

On success the handler MUST emit `PlantSpeciesDeleted`.

#### Scenario: Delete unused entry

- GIVEN a catalog entry with zero plants referencing its id
- WHEN DeletePlantSpecies is dispatched
- THEN the entry is removed and PlantSpeciesDeleted is emitted

#### Scenario: Delete referenced entry blocked

- GIVEN a catalog entry referenced by at least one plant's `plantSpeciesId`
- WHEN DeletePlantSpecies is dispatched
- THEN PlantSpeciesInUseException is thrown and 409 is returned

---

### Requirement: PlantSpeciesFindById Query

The system MUST return a `PlantSpeciesViewModel` for a given id from the global catalog.

If absent, PlantSpeciesNotFoundException MUST be thrown (404).

#### Scenario: Happy path

- GIVEN a plantSpeciesId that exists
- WHEN PlantSpeciesFindById is dispatched
- THEN a PlantSpeciesViewModel is returned

---

### Requirement: PlantSpeciesFindByCriteria Query

The system MUST return a paginated list of all catalog entries (global; not filtered by space).

#### Scenario: List all entries

- GIVEN multiple catalog entries
- WHEN PlantSpeciesFindByCriteria is dispatched
- THEN a PaginatedResult containing entries from the global catalog is returned

---

### Requirement: No Tenant Repository for Catalog

Read and write repository access for plant-species MUST use standard TypeORM repositories without `createTenantRepository`.

The `plant_species` table MUST NOT include a `space_id` column.

#### Scenario: Catalog row has no space

- GIVEN a persisted catalog entry
- WHEN the row is read from the database
- THEN only `id`, `name`, and timestamps are present

---

### Requirement: REST Transport

The system MUST expose plant-species CRUD via REST.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/plant-species` | Create |
| GET | `/plant-species` | List (paginated) |
| GET | `/plant-species/:id` | Fetch by id |
| PATCH | `/plant-species/:id` | Update name |
| DELETE | `/plant-species/:id` | Delete |

All endpoints MUST require JWT authentication only (no active space header required).

Transport MUST dispatch via `CommandBus` and `QueryBus`.

#### Scenario: REST create

- GIVEN valid JWT
- WHEN POST `/plant-species` with `{ "name": "Basil" }`
- THEN 201 is returned with the created entry

---

### Requirement: GraphQL Transport

The system MUST expose plant-species CRUD via GraphQL with parity to REST.

Queries MUST include fetch-by-id and paginated list. Mutations MUST include create, update, and delete.

Resolvers MUST use `CommandBus` / `QueryBus` only.

#### Scenario: GraphQL create mutation

- GIVEN valid JWT in GraphQL context
- WHEN `createPlantSpecies` mutation is executed with a valid unique name
- THEN the created `PlantSpecies` object is returned

#### Scenario: GraphQL list query

- GIVEN valid JWT
- WHEN `plantSpeciesList` query is executed
- THEN paginated catalog entries are returned
