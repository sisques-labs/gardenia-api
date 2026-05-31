# Delta for Plants — QR Integration

**Change:** plant-qr-generation  
**Base spec:** `openspec/changes/plant-context/specs/plants/spec.md`  
**Date:** 2026-05-31

This file defines requirement changes to the `plants` bounded context for QR linking. At archive time, merge ADDED/MODIFIED sections into `openspec/specs/plants/spec.md` when that canonical spec exists.

---

## ADDED Requirements

### Requirement: Plant QR Link Fields

The PlantAggregate, PlantViewModel, IPlantPrimitives, and plant persistence entity MUST support an optional `qrId` (UUID string or null).

Plant REST and GraphQL read responses MUST include optional fields `qrId` and `targetUrl` when a QR is linked.

`targetUrl` MUST be sourced from the linked QR record (not computed ad hoc in transport).

#### Scenario: Plant with QR returns link fields

- **GIVEN** a plant with qrId pointing to a valid QR
- **WHEN** PlantFindById is dispatched
- **THEN** PlantViewModel includes qrId and targetUrl

#### Scenario: Legacy plant without QR

- **GIVEN** a plant with qrId null
- **WHEN** PlantFindById is dispatched
- **THEN** PlantViewModel is returned with qrId and targetUrl absent or null

---

### Requirement: SetPlantQrId Command

The system MUST provide an internal command SetPlantQrId that sets `plants.qr_id` for a given plantId.

The command MUST be invocable only for plants in the active space.

#### Scenario: qr_id set after QR creation

- **GIVEN** a persisted plant without qrId
- **WHEN** SetPlantQrId is dispatched with a valid qrId
- **THEN** the plant row is updated with qr_id

---

## MODIFIED Requirements

### Requirement: CreatePlant Command

The system MUST allow any authenticated space member to create a plant.

The command MUST accept `name` (required), `species` (optional), `imageUrl` (optional), and `userId` (from `@CurrentUser`). `spaceId` MUST be sourced from `SpaceContext` ALS — never from the request payload.

On success the handler MUST emit `PlantCreated`, persist the plant, then MUST orchestrate QR creation by:

1. Building `targetUrl` as `{QR_BASE_URL}/plants/{plantId}?spaceId={spaceId}` (plants application layer).
2. Dispatching `CreateQrCommand` with `targetUrl` and `spaceId`.
3. Dispatching `SetPlantQrIdCommand` with the returned `qrId`.
4. Returning the new `plantId`.

If `CreateQrCommand` fails after the plant is saved, the handler MUST propagate the error (plant may exist without QR until a follow-up fix — documented operational risk).

#### Scenario: Happy path — plant created with QR

- **GIVEN** an authenticated user who is a member of the active space
- **WHEN** CreatePlant is dispatched with a valid name
- **THEN** a PlantAggregate is persisted, PlantCreated is emitted, a linked QR is created, plants.qr_id is set, and plantId is returned

#### Scenario: Name missing — rejected

- **GIVEN** an authenticated user in an active space
- **WHEN** CreatePlant is dispatched with an empty name
- **THEN** a 400 Bad Request is returned and no aggregate is persisted

---

### Requirement: DeletePlant Command — Owner Only

The system MUST allow only the plant owner to delete a plant.

The handler MUST load the plant from the tenant-scoped repository, compare `plant.userId` with `requestingUserId`, and throw `NotPlantOwnerException` when they differ.

The handler MUST delete the plant row only; linked QR rows MUST be removed by DB `ON DELETE CASCADE` via `qrs.plant_id` (application-level `DeleteQrCommand` is not required for this flow).

On success the handler MUST emit `PlantDeleted`.

#### Scenario: Owner deletes plant and QR

- **GIVEN** an authenticated user who owns the target plant with a linked QR
- **WHEN** DeletePlant is dispatched
- **THEN** the linked QR is deleted, the plant is removed, PlantDeleted is emitted, and 200 is returned

#### Scenario: Non-owner delete rejected

- **GIVEN** an authenticated user who does NOT own the target plant
- **WHEN** DeletePlant is dispatched
- **THEN** NotPlantOwnerException is thrown and a 403 is returned

#### Scenario: Plant not found

- **GIVEN** a plantId that does not exist in the active space
- **WHEN** DeletePlant is dispatched
- **THEN** PlantNotFoundException is thrown and a 404 is returned

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

All endpoints MUST require `X-Space-ID` header (no `@SkipSpace`). `@CurrentUser` supplies `userId` for mutation commands. Response bodies MUST use `PlantRestResponseDto` mapped from `PlantViewModel`, including optional `qrId` and `targetUrl` when present.

---

### Requirement: GraphQL Transport

The system MUST expose GraphQL operations guarded by `JwtAuthGuard` and `SpaceGuard`:

**Queries**: `plant(id: ID!): PlantType`, `plants(criteria: PlantCriteriaInput): PaginatedPlantsResult`

**Mutations**: `createPlant(input: CreatePlantInput!): MutationResponseDto`, `updatePlant(input: UpdatePlantInput!): MutationResponseDto`, `deletePlant(id: ID!): MutationResponseDto`

`PlantType` MUST include optional `qrId` and `targetUrl` fields when a QR is linked.

Schema MUST be generated via `autoSchemaFile` (code-first). Both resolvers MUST dispatch exclusively via `CommandBus`/`QueryBus` — no direct service injection.

---

## Out of Scope (plants delta)

- Backfill QR for plants created before this change
- Owner-only restriction on `qrRegenerate` (any space member may regenerate via QR endpoints unless a future rule adds owner check)
