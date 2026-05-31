# Plants — QR & Species Catalog Integration

**Source changes:** plant-qr-generation (archived 2026-05-31) + plant-qr-view-model (archived 2026-05-31) + plant-species-module (archived 2026-05-31)  
**Last updated:** 2026-05-31

This canonical spec consolidates QR linking, species catalog linking, and port decoupling requirements for the `plants` bounded context.

---

## ADDED Requirements

### Requirement: IPlantQrPort Contract

The `plants` bounded context MUST define `IPlantQrPort` in `plants/application/ports/` and `PlantQrViewModel` in `plants/domain/view-models/`. No file under `plants/application/` or `plants/domain/` MAY import from `@contexts/qr/` or any other bounded context.

`IPlantQrPort` MUST expose: `findByQrId(qrId: string): Promise<PlantQrViewModel | null>`.

`PlantQrViewModel` MUST carry: `id: string`, `spaceId: string`, `targetUrl: string`, `generation: number`, `image: string` (base64 PNG), `createdAt: Date`, `updatedAt: Date`.

#### Scenario: Port returns data when QR exists

- GIVEN a plant with a linked QR
- WHEN `IPlantQrPort.findByQrId` is called with the plant's qrId
- THEN it returns a `PlantQrViewModel` with all QR fields populated

#### Scenario: Port returns null when no QR

- GIVEN a plant without a linked QR
- WHEN `IPlantQrPort.findByQrId` is called
- THEN it returns `null`

---

### Requirement: EnrichPlantWithQrService Unit Spec

`EnrichPlantWithQrService` MUST have a co-located unit spec (`enrich-plant-with-qr.service.spec.ts`) using `jest.Mocked<IPlantQrPort>`.

The spec MUST cover: enrichment when QR exists, enrichment when QR is absent, and isolation (no real QR infrastructure invoked).

#### Scenario: Service enriches plant when QR found

- GIVEN a mocked `IPlantQrPort` that returns `PlantQrViewModel`
- WHEN `EnrichPlantWithQrService.execute` is called
- THEN the returned `PlantViewModel` has `qr` populated with the full `PlantQrViewModel`

#### Scenario: Service returns plant unchanged when QR absent

- GIVEN a mocked `IPlantQrPort` that returns `null`
- WHEN `EnrichPlantWithQrService.execute` is called
- THEN the same `PlantViewModel` reference is returned unchanged with `qr: null`

---

### Requirement: Plant QR Link Fields

The `PlantAggregate`, `IPlantPrimitives`, and plant persistence entity MUST support an optional `qrId` (UUID string or null).

`PlantViewModel` MUST support an optional `qr: PlantQrViewModel | null` field. The `qr` object is enrichment-only and MUST NOT be persisted in `IPlantPrimitives` or the TypeORM entity.

Plant REST and GraphQL read responses MUST include a nested `qr` object with all `PlantQrViewModel` fields when a QR is linked, or `null` when no QR is linked.

#### Scenario: Plant with QR returns qr object including image

- GIVEN a plant with `qrId` pointing to a valid QR
- WHEN `PlantFindById` is dispatched
- THEN `PlantViewModel.qr` includes `id`, `spaceId`, `targetUrl`, `generation`, `image` (base64 PNG), `createdAt`, `updatedAt`

#### Scenario: Plant with QR in list query returns qr object

- GIVEN multiple plants, each with a linked QR
- WHEN `PlantFindByCriteria` is dispatched
- THEN each item in the result has `qr` populated

#### Scenario: Legacy plant without QR returns null qr

- GIVEN a plant with `qrId` null
- WHEN `PlantFindById` is dispatched
- THEN `PlantViewModel` is returned with `qr: null`

---

### Requirement: IPlantSpeciesPort Contract

The `plants` bounded context MUST define `IPlantSpeciesPort` in `plants/application/ports/` and `PlantSpeciesViewModel` in `plants/domain/view-models/`. No file under `plants/application/` or `plants/domain/` MAY import from `@contexts/plant-species/`.

`IPlantSpeciesPort` MUST expose: `findByPlantSpeciesId(plantSpeciesId: string): Promise<PlantSpeciesViewModel | null>`.

`PlantSpeciesViewModel` MUST carry: `id: string`, `name: string`, `createdAt: Date`, `updatedAt: Date`.

#### Scenario: Port returns data when catalog entry exists

- GIVEN a plant with `plantSpeciesId` set
- WHEN `IPlantSpeciesPort.findByPlantSpeciesId` is called
- THEN it returns a `PlantSpeciesViewModel` with all fields populated

#### Scenario: Port returns null when catalog entry missing

- GIVEN a plant with `plantSpeciesId` pointing to a deleted or unknown id
- WHEN `IPlantSpeciesPort.findByPlantSpeciesId` is called
- THEN it returns `null`

---

### Requirement: EnrichPlantWithSpeciesService

`EnrichPlantWithSpeciesService` MUST have a co-located unit spec using `jest.Mocked<IPlantSpeciesPort>`.

The spec MUST cover: enrichment when species exists, unchanged plant when `plantSpeciesId` is null, unchanged plant when port returns null.

#### Scenario: Service enriches plant when species found

- GIVEN a mocked `IPlantSpeciesPort` that returns `PlantSpeciesViewModel`
- WHEN `EnrichPlantWithSpeciesService.execute` is called
- THEN `PlantViewModel.species` is populated

#### Scenario: Service returns plant unchanged when no link

- GIVEN a plant with `plantSpeciesId` null
- WHEN `EnrichPlantWithSpeciesService.execute` is called
- THEN `PlantViewModel.species` is `null`

---

### Requirement: Plant Species Link Fields

The `PlantAggregate`, `IPlantPrimitives`, and plant persistence entity MUST support an optional `plantSpeciesId` (UUID string or null).

The `plants.species` varchar column and `PlantSpeciesValueObject` MUST NOT exist.

`PlantViewModel` MUST expose `plantSpeciesId: string | null` and `species: PlantSpeciesViewModel | null`. The nested `species` object is enrichment-only and MUST NOT be persisted in primitives or the TypeORM entity.

Plant REST and GraphQL read responses MUST include nested `species` when linked, or `species: null` when `plantSpeciesId` is null.

Create and update plant commands MUST accept optional `plantSpeciesId` and MUST NOT accept a free-text `species` field.

When `plantSpeciesId` is provided, the handler MUST verify the catalog entry exists before persisting.

#### Scenario: Plant with species link returns nested species

- GIVEN a plant with `plantSpeciesId` pointing to a valid catalog entry
- WHEN `PlantFindById` is dispatched
- THEN `PlantViewModel.species` includes `id`, `name`, `createdAt`, `updatedAt`

#### Scenario: Plant without species link

- GIVEN a plant with `plantSpeciesId` null
- WHEN `PlantFindById` is dispatched
- THEN `PlantViewModel.plantSpeciesId` is null and `species` is null

#### Scenario: Create plant with plantSpeciesId

- GIVEN a valid catalog entry id
- WHEN `CreatePlant` is dispatched with `plantSpeciesId` set
- THEN the plant is persisted with that id and reads return enriched `species`

#### Scenario: Create plant rejects unknown plantSpeciesId

- GIVEN a non-existent catalog id
- WHEN `CreatePlant` is dispatched with that `plantSpeciesId`
- THEN the command fails with an appropriate not-found error

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

The command MUST accept `name` (required), `plantSpeciesId` (optional), `imageUrl` (optional), and `userId` (from `@CurrentUser`). `spaceId` MUST be sourced from `SpaceContext` ALS — never from the request payload.

When `plantSpeciesId` is provided, the handler MUST verify the catalog entry exists before persisting.

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

When `plant.qrId` is set, the handler MUST dispatch `DeleteQrCommand` before deleting the plant row. The database trigger `TRG_plants_delete_linked_qr` remains as a safety net for orphan prevention.

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

All endpoints MUST require `X-Space-ID` header (no `@SkipSpace`). `@CurrentUser` supplies `userId` for mutation commands. Response bodies MUST use `PlantRestResponseDto` mapped from `PlantViewModel`, including nested `species: PlantSpeciesRestResponseDto | null` and `qr: PlantQrRestResponseDto | null`.

---

### Requirement: GraphQL Transport

The system MUST expose GraphQL operations guarded by `JwtAuthGuard` and `SpaceGuard`:

**Queries**: `plant(id: ID!): PlantType`, `plants(criteria: PlantCriteriaInput): PaginatedPlantsResult`

**Mutations**: `createPlant(input: CreatePlantInput!): MutationResponseDto`, `updatePlant(input: UpdatePlantInput!): MutationResponseDto`, `deletePlant(id: ID!): MutationResponseDto`

`PlantType` MUST include nullable `species: PlantSpeciesResponseDto` and `qr: PlantQrResponseDto` fields. `species` returns `null` when no catalog link exists. `qr` returns `null` when no QR is linked.

Schema MUST be generated via `autoSchemaFile` (code-first). Both resolvers MUST dispatch exclusively via `CommandBus`/`QueryBus`.

---

## Out of Scope

- Changing `IPlantPrimitives` or the TypeORM entity — `qr` is enrichment-only, not persisted
- Solving N+1 / 2N query pattern in `FindPlantsByCriteria` (accepted tradeoff from plant-qr-view-model)
- QR caching, payload compression, or image-size limits
- Backfill QR for plants created before plant-qr-generation change
- Owner-only restriction on `qrRegenerate` (any space member may regenerate via QR endpoints unless a future rule adds owner check)
