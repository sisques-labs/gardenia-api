# Plants Specification

## Purpose

This spec governs the `plants` bounded context — the 4th context in gardenia-api. It defines the PlantAggregate, CRUD commands and queries, dual REST+GraphQL transport, per-space tenant isolation, and owner-only mutation authorization. `admin-authorization` (role-based bypass) is explicitly OUT OF SCOPE.

## Requirements

### Requirement: PlantAggregate Fields and Validation

The PlantAggregate MUST carry: `id` (UUID, generated), `name` (non-empty string, required), `species` (optional string), `imageUrl` (optional string), `userId` (UUID string, owner), `spaceId` (UUID string, tenant), `createdAt`, `updatedAt`.

The system MUST reject aggregate creation when `name` is empty or whitespace.

`userId` and `spaceId` MUST be stored as bare UUID strings — no TypeORM FK relations.

#### Scenario: Valid plant aggregate

- GIVEN a name, optional species, optional imageUrl, a userId, and a spaceId
- WHEN a PlantAggregate is built
- THEN all fields are set and the aggregate is valid

#### Scenario: Empty name rejected

- GIVEN an empty string for name
- WHEN PlantAggregate is built
- THEN a domain validation error is thrown

---

### Requirement: CreatePlant Command

The system MUST allow any authenticated space member to create a plant.

The command MUST accept `name` (required), `species` (optional), `imageUrl` (optional), and `userId` (from `@CurrentUser`). `spaceId` MUST be sourced from `SpaceContext` ALS — never from the request payload.

On success the handler MUST emit `PlantCreated` and return the new `plantId`.

#### Scenario: Happy path — plant created

- GIVEN an authenticated user who is a member of the active space
- WHEN CreatePlant is dispatched with a valid name
- THEN a PlantAggregate is persisted, PlantCreated is emitted, and the plantId is returned

#### Scenario: Name missing — rejected

- GIVEN an authenticated user in an active space
- WHEN CreatePlant is dispatched with an empty name
- THEN a 400 Bad Request is returned and no aggregate is persisted

---

### Requirement: UpdatePlant Command — Owner Only

The system MUST allow only the plant owner to update a plant.

The handler MUST load the plant from the tenant-scoped repository, compare `plant.userId` with `requestingUserId`, and throw `NotPlantOwnerException` when they differ.

The command MAY update `name`, `species`, and/or `imageUrl` (all optional fields). On success the handler MUST emit `PlantUpdated`.

#### Scenario: Owner updates plant

- GIVEN an authenticated user who owns the target plant in the active space
- WHEN UpdatePlant is dispatched with at least one field to change
- THEN the plant is updated, PlantUpdated is emitted, and 200 is returned

#### Scenario: Non-owner update rejected

- GIVEN an authenticated user who does NOT own the target plant
- WHEN UpdatePlant is dispatched
- THEN NotPlantOwnerException is thrown and a 403 is returned

#### Scenario: Plant not found

- GIVEN a plantId that does not exist in the active space
- WHEN UpdatePlant is dispatched
- THEN PlantNotFoundException is thrown and a 404 is returned

---

### Requirement: DeletePlant Command — Owner Only

The system MUST allow only the plant owner to delete a plant.

The handler MUST apply the same `plant.userId === requestingUserId` check as UpdatePlant and throw `NotPlantOwnerException` on mismatch. On success the handler MUST emit `PlantDeleted`.

#### Scenario: Owner deletes plant

- GIVEN an authenticated user who owns the target plant in the active space
- WHEN DeletePlant is dispatched
- THEN the plant is removed, PlantDeleted is emitted, and 200 is returned

#### Scenario: Non-owner delete rejected

- GIVEN an authenticated user who does NOT own the target plant
- WHEN DeletePlant is dispatched
- THEN NotPlantOwnerException is thrown and a 403 is returned

---

### Requirement: PlantFindById Query

The system MUST return a `PlantViewModel` for a given `plantId` scoped to the active space.

If the plant does not exist in the active space the system MUST throw `PlantNotFoundException`.

#### Scenario: Happy path — plant returned

- GIVEN a plantId that exists in the active space
- WHEN PlantFindById is dispatched
- THEN a PlantViewModel is returned

#### Scenario: Plant not in active space

- GIVEN a plantId that exists in a different space
- WHEN PlantFindById is dispatched with the active space set to space B
- THEN PlantNotFoundException is thrown (cross-space plant is invisible)

---

### Requirement: PlantFindByCriteria Query

The system MUST return a `PaginatedResult<PlantViewModel>` for the active space filtered by the provided Criteria.

`spaceId` MUST be sourced from `SpaceContext` ALS; cross-space plants MUST NOT appear in results.

#### Scenario: Happy path — paginated list

- GIVEN the active space has two plants
- WHEN PlantFindByCriteria is dispatched with default pagination
- THEN both plants are returned and the total count is 2

#### Scenario: Tenant isolation in list

- GIVEN space A has one plant and space B has one plant
- WHEN PlantFindByCriteria is dispatched with space A as the active space
- THEN only space A's plant is returned

---

### Requirement: REST Transport

The system MUST expose the following endpoints, all guarded by `JwtAuthGuard` and `SpaceGuard`:

| Method | Path | Handler | Success Code |
|--------|------|---------|--------------|
| POST | /plants | CreatePlant | 201 |
| GET | /plants | PlantFindByCriteria | 200 |
| GET | /plants/:id | PlantFindById | 200 |
| PATCH | /plants/:id | UpdatePlant | 200 |
| DELETE | /plants/:id | DeletePlant | 200 |

All endpoints MUST require `X-Space-ID` header (no `@SkipSpace`). `@CurrentUser` supplies `userId` for mutation commands. Response bodies MUST use `PlantRestResponseDto` mapped from `PlantViewModel`.

---

### Requirement: GraphQL Transport

The system MUST expose GraphQL operations guarded by `JwtAuthGuard` and `SpaceGuard`:

**Queries**: `plant(id: ID!): PlantType`, `plants(criteria: PlantCriteriaInput): PaginatedPlantsResult`

**Mutations**: `createPlant(input: CreatePlantInput!): MutationResponseDto`, `updatePlant(input: UpdatePlantInput!): MutationResponseDto`, `deletePlant(id: ID!): MutationResponseDto`

Schema MUST be generated via `autoSchemaFile` (code-first). Both resolvers MUST dispatch exclusively via `CommandBus`/`QueryBus` — no direct service injection.

---

### Requirement: Cross-Space Isolation

The system MUST enforce that plants are never readable or mutable outside the space in which they were created.

Both read and write repositories MUST be wrapped with `createTenantRepository`, sourcing `spaceId` from `SpaceContext` ALS. Any attempt to access a plant from a different space MUST result in a 404 (plant invisible) or a `SpaceContextMissingException` if no space context is active.

#### Scenario: Cross-space read blocked

- GIVEN plant P1 was created in space A
- WHEN a user authenticates and sets space B as active, then queries P1 by id
- THEN PlantNotFoundException is thrown

---

## Non-Functional Requirements

- All REST and GraphQL endpoints MUST require a valid JWT (`JwtAuthGuard`).
- All endpoints MUST require active space membership (`SpaceGuard`).
- Ownership violations on Update/Delete MUST return HTTP 403 / GraphQL error with code `FORBIDDEN`.
- Test coverage MUST be ≥ 80% for the plants context. Tests MUST cover unit (domain+handlers), integration (persistence + tenant boundary), and E2E (REST + GraphQL) layers.

---

## Domain Events

| Event | Payload |
|-------|---------|
| `PlantCreated` | `{ plantId, name, species?, imageUrl?, userId, spaceId, createdAt }` |
| `PlantUpdated` | `{ plantId, name?, species?, imageUrl?, userId, spaceId, updatedAt }` |
| `PlantDeleted` | `{ plantId, userId, spaceId, deletedAt }` |

All events extend `BaseEvent<TData>`.

---

## Error Scenarios

| Exception | HTTP Code | Trigger |
|-----------|-----------|---------|
| `PlantNotFoundException` | 404 | Plant does not exist in the active space |
| `NotPlantOwnerException` | 403 | Requesting user is not the plant owner on Update/Delete |
| Validation error | 400 | `name` is empty; DTO class-validator constraint fails |

---

## Out of Scope

- `admin-authorization` — admin/role bypass for Update/Delete (tracked as a separate pending openspec change)
- Location module — no `locationId` field on PlantAggregate
- Tasks module — no `lastWateredAt` or care schedules
- Per-field change events — only a single `PlantUpdated` event
- Image upload/storage — `imageUrl` is a plain client-supplied string
- Domain operations beyond CRUD
