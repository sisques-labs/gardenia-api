# Delta for Plants — QR View Model + Port Decoupling

**Change:** plant-qr-view-model
**Base spec:** `openspec/specs/plants/spec.md`
**Date:** 2026-05-31

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

## MODIFIED Requirements

### Requirement: Plant QR Link Fields

The `PlantAggregate`, `IPlantPrimitives`, and plant persistence entity MUST support an optional `qrId` (UUID string or null).

`PlantViewModel` MUST support an optional `qr: PlantQrViewModel | null` field. The `qr` object is enrichment-only and MUST NOT be persisted in `IPlantPrimitives` or the TypeORM entity.

Plant REST and GraphQL read responses MUST include a nested `qr` object with all `PlantQrViewModel` fields when a QR is linked, or `null` when no QR is linked.

(Previously: only `qrId` and `targetUrl` were flat fields; `qr` object was not present.)

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

### Requirement: REST Transport

The system MUST expose the following endpoints, all guarded by `JwtAuthGuard` and `SpaceGuard`:

| Method | Path | Handler | Success Code |
|--------|------|---------|--------------|
| POST | /plants | CreatePlant | 201 |
| GET | /plants | PlantFindByCriteria | 200 |
| GET | /plants/:id | PlantFindById | 200 |
| PATCH | /plants/:id | UpdatePlant | 200 |
| DELETE | /plants/:id | DeletePlant | 200 |

All endpoints MUST require `X-Space-ID` header (no `@SkipSpace`). `@CurrentUser` supplies `userId` for mutation commands. Response bodies MUST use `PlantRestResponseDto` mapped from `PlantViewModel`, including a nested `qr: PlantQrRestResponseDto | null`.

(Previously: response included flat `qrId` and `targetUrl` but not the nested `qr` object.)

---

### Requirement: GraphQL Transport

The system MUST expose GraphQL operations guarded by `JwtAuthGuard` and `SpaceGuard`:

**Queries**: `plant(id: ID!): PlantType`, `plants(criteria: PlantCriteriaInput): PaginatedPlantsResult`

**Mutations**: `createPlant(input: CreatePlantInput!): MutationResponseDto`, `updatePlant(input: UpdatePlantInput!): MutationResponseDto`, `deletePlant(id: ID!): MutationResponseDto`

`PlantType` MUST include a nullable `qr: PlantQrResponseDto` field. `PlantQrResponseDto` MUST expose all `PlantQrViewModel` fields. `qr` returns `null` when no QR is linked.

Schema MUST be generated via `autoSchemaFile` (code-first). Both resolvers MUST dispatch exclusively via `CommandBus`/`QueryBus`.

(Previously: `PlantType` included flat `qrId` and `targetUrl` but not the nested `qr` object.)

---

## Out of Scope (plant-qr-view-model delta)

- Changing `IPlantPrimitives` or the TypeORM entity (`qr` is enrichment-only, not persisted)
- Solving N+1 / 2N query pattern in `FindPlantsByCriteria` (accepted tradeoff)
- QR caching, payload compression, or image-size limits
