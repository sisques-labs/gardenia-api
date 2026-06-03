# Tasks: PlantingSpots bounded context (cultivos — Phase 1)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1 200 – 1 600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → Domain + Application · PR 2 → Infrastructure + Migration · PR 3 → Transport + Module wiring · PR 4 → Tests |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + Application layer (no I/O) | PR 1 | Aggregate, VOs, events, exceptions, ports, commands, queries, assert services |
| 2 | Infrastructure layer + migration | PR 2 | TypeORM entity, mapper, write repo (QR), read repo (QR), stub adapter, migration |
| 3 | Transport + module wiring | PR 3 | REST controller + DTOs, GraphQL resolver + types, PlantingSpotsModule, app.module.ts |
| 4 | Tests (unit + integration + e2e) | PR 4 | All test files; references SC-01 → SC-16 |

---

## Phase 1: Domain

- [x] 1.1 Create `src/contexts/planting-spots/domain/enums/planting-spot-type.enum.ts` — `PlantingSpotTypeEnum` (`raised_bed`, `pot`, `container`, `field_section`, `other`)
- [x] 1.2 Create `src/contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object.ts` — extends `UuidValueObject`
- [x] 1.3 Create `src/contexts/planting-spots/domain/value-objects/planting-spot-name/planting-spot-name.value-object.ts` — non-empty, max 255
- [x] 1.4 Create `src/contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object.ts` — extends `EnumValueObject<PlantingSpotTypeEnum>`, validates in constructor
- [x] 1.5 Create `src/contexts/planting-spots/domain/value-objects/planting-spot-description/planting-spot-description.value-object.ts` — nullable, max 1000
- [x] 1.6 Create `src/contexts/planting-spots/domain/events/interfaces/planting-spot-event-data.interface.ts`
- [x] 1.7 Create `src/contexts/planting-spots/domain/events/planting-spot-created/planting-spot-created.event.ts`
- [x] 1.8 Create `src/contexts/planting-spots/domain/events/planting-spot-updated/planting-spot-updated.event.ts`
- [x] 1.9 Create `src/contexts/planting-spots/domain/events/planting-spot-deleted/planting-spot-deleted.event.ts`
- [x] 1.10 Create `src/contexts/planting-spots/domain/events/field-changed/name-changed/name-changed.event.ts`
- [x] 1.11 Create `src/contexts/planting-spots/domain/events/field-changed/type-changed/type-changed.event.ts`
- [x] 1.12 Create `src/contexts/planting-spots/domain/events/field-changed/description-changed/description-changed.event.ts`
- [x] 1.13 Create `src/contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception.ts` — HTTP 404
- [x] 1.14 Create `src/contexts/planting-spots/domain/exceptions/planting-spot-forbidden.exception.ts` — HTTP 403
- [x] 1.15 Create `src/contexts/planting-spots/domain/exceptions/planting-spot-in-use.exception.ts` — HTTP 409
- [x] 1.16 Create `src/contexts/planting-spots/domain/interfaces/planting-spot.interface.ts`
- [x] 1.17 Create `src/contexts/planting-spots/domain/primitives/planting-spot.primitives.ts`
- [x] 1.18 Create `src/contexts/planting-spots/domain/view-models/planting-spot.view-model.ts`
- [x] 1.19 Create `src/contexts/planting-spots/domain/repositories/write/planting-spot-write.repository.ts` — `IPlantingSpotWriteRepository` interface + `PLANTING_SPOT_WRITE_REPOSITORY` token
- [x] 1.20 Create `src/contexts/planting-spots/domain/repositories/read/planting-spot-read.repository.ts` — `IPlantingSpotReadRepository` interface + `PLANTING_SPOT_READ_REPOSITORY` token; includes `PlantingSpotCriteria` type
- [x] 1.21 Create `src/contexts/planting-spots/domain/aggregates/planting-spot.aggregate.ts` — `create()`, `update({name?,type?,description?})`, `delete()`; emits events; carries `userId`, `spaceId`
- [x] 1.22 Create `src/contexts/planting-spots/domain/builders/planting-spot.builder.ts`

## Phase 2: Application

- [x] 2.1 Create `src/contexts/planting-spots/application/ports/planting-spot-in-use.port.ts` — `IPlantingSpotInUsePort` interface + `PLANTING_SPOT_IN_USE_PORT` symbol
- [x] 2.2 Create `src/contexts/planting-spots/application/services/write/assert-planting-spot-exists/assert-planting-spot-exists.service.ts` — throws `PlantingSpotNotFoundException` when null
- [x] 2.3 Create `src/contexts/planting-spots/application/services/write/assert-planting-spot-not-in-use/assert-planting-spot-not-in-use.service.ts` — injects `IPlantingSpotInUsePort`; throws `PlantingSpotInUseException` when count > 0
- [x] 2.4 Create `src/contexts/planting-spots/application/services/read/assert-planting-spot-view-model-exists/assert-planting-spot-view-model-exists.service.ts`
- [x] 2.5 Create `src/contexts/planting-spots/application/commands/create-planting-spot/create-planting-spot.command.ts`
- [x] 2.6 Create `src/contexts/planting-spots/application/commands/create-planting-spot/create-planting-spot.handler.ts` — uses `AssertPlantingSpotExistsService`; saves via write repo; dispatches `PlantingSpotCreated`
- [x] 2.7 Create `src/contexts/planting-spots/application/commands/update-planting-spot/update-planting-spot.command.ts`
- [x] 2.8 Create `src/contexts/planting-spots/application/commands/update-planting-spot/update-planting-spot.handler.ts` — checks ownership (403); dispatches `PlantingSpotUpdated`
- [x] 2.9 Create `src/contexts/planting-spots/application/commands/delete-planting-spot/delete-planting-spot.command.ts`
- [x] 2.10 Create `src/contexts/planting-spots/application/commands/delete-planting-spot/delete-planting-spot.handler.ts` — checks ownership (403); calls `AssertPlantingSpotNotInUseService`; dispatches `PlantingSpotDeleted`
- [x] 2.11 Create `src/contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query.ts`
- [x] 2.12 Create `src/contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.handler.ts` — returns `PlantingSpotViewModel`; 404 if not found or wrong space
- [x] 2.13 Create `src/contexts/planting-spots/application/queries/planting-spot-find-by-criteria/planting-spot-find-by-criteria.query.ts` — includes `type?`, `page`, `limit`
- [x] 2.14 Create `src/contexts/planting-spots/application/queries/planting-spot-find-by-criteria/planting-spot-find-by-criteria.handler.ts` — always scoped to `spaceId`; empty list returns 200

## Phase 3: Infrastructure

- [x] 3.1 Create `src/contexts/planting-spots/infrastructure/persistence/typeorm/entities/planting-spot.entity.ts` — `planting_spots` table; `space_id` NOT NULL; `type` varchar; indexed `space_id`
- [x] 3.2 Create `src/contexts/planting-spots/infrastructure/persistence/typeorm/mappers/planting-spot-typeorm.mapper.ts` — `toDomain()` + `toPersistence()`
- [x] 3.3 Create `src/contexts/planting-spots/infrastructure/persistence/typeorm/repositories/planting-spot-typeorm-write.repository.ts` — extends `BaseDatabaseRepository`; uses `createTenantRepository(rawRepo, spaceContext)` in constructor; implements `IPlantingSpotWriteRepository`
- [x] 3.4 Create `src/contexts/planting-spots/infrastructure/persistence/typeorm/repositories/planting-spot-typeorm-read.repository.ts` — extends `BaseDatabaseRepository`; `createTenantRepository` pattern; implements `IPlantingSpotReadRepository`; `findByCriteria` supports `type` filter + pagination (default page=1, limit=20, max=100)
- [x] 3.5 Create `src/contexts/planting-spots/infrastructure/adapters/planting-spot-in-use-stub.adapter.ts` — implements `IPlantingSpotInUsePort`; `countByPlantingSpotId` always resolves `0`
- [x] 3.6 Create `src/database/migrations/1780000000010-CreatePlantingSpots.ts` — `up()` creates `planting_spots` with `id`, `name`, `type`, `description`, `user_id`, `space_id`, `created_at`, `updated_at`; `IDX_planting_spots_space_id`; `down()` drops table

## Phase 4: Transport

- [ ] 4.1 Create `src/contexts/planting-spots/transport/rest/dtos/create-planting-spot.dto.ts` — `name` (required), `type` (required, enum), `description` (optional)
- [ ] 4.2 Create `src/contexts/planting-spots/transport/rest/dtos/update-planting-spot.dto.ts` — all fields optional
- [ ] 4.3 Create `src/contexts/planting-spots/transport/rest/dtos/planting-spot-rest-response.dto.ts`
- [ ] 4.4 Create `src/contexts/planting-spots/transport/rest/mappers/planting-spot/planting-spot.mapper.ts` — `PlantingSpotViewModel → PlantingSpotRestResponseDto`
- [ ] 4.5 Create `src/contexts/planting-spots/transport/rest/controllers/planting-spots.controller.ts` — routes: POST `/planting-spots`, PATCH `/:id`, DELETE `/:id`, GET `/:id`, GET `/`; guards: `JwtAuthGuard` + `SpaceGuard`; injects `userId` + `spaceId` from auth context
- [ ] 4.6 Create `src/contexts/planting-spots/transport/graphql/enums/planting-spot-registered-enums.graphql.ts` — registers `PlantingSpotTypeEnum` with `registerEnumType`
- [ ] 4.7 Create `src/contexts/planting-spots/transport/graphql/dtos/requests/create-planting-spot-graphql.dto.ts` + `update-planting-spot-graphql.dto.ts` + `find-by-criteria-graphql.dto.ts`
- [ ] 4.8 Create `src/contexts/planting-spots/transport/graphql/dtos/responses/planting-spot.response.dto.ts` — `@ObjectType()`
- [ ] 4.9 Create `src/contexts/planting-spots/transport/graphql/mappers/planting-spot.mapper.ts`
- [ ] 4.10 Create `src/contexts/planting-spots/transport/graphql/resolvers/planting-spot-queries.resolver.ts` — `plantingSpot(id)`, `plantingSpots(criteria)`; guards: `JwtAuthGuard` + `SpaceGuard`
- [ ] 4.11 Create `src/contexts/planting-spots/transport/graphql/resolvers/planting-spot-mutations.resolver.ts` — `createPlantingSpot`, `updatePlantingSpot`, `deletePlantingSpot`; same guards

## Phase 5: Module Wiring

- [ ] 5.1 Create `src/contexts/planting-spots/planting-spots.module.ts` — providers: all handlers, assert services, stub adapter (bound to `PLANTING_SPOT_IN_USE_PORT`), write repo (bound to `PLANTING_SPOT_WRITE_REPOSITORY`), read repo (bound to `PLANTING_SPOT_READ_REPOSITORY`); `TypeOrmModule.forFeature([PlantingSpotEntity])`
- [ ] 5.2 Modify `src/app.module.ts` — add `PlantingSpotsModule` to `imports[]`
- [ ] 5.3 Inspect `src/core/filters/base-exception.filter.ts` — if filter enumerates exceptions explicitly, add `PlantingSpotInUseException` → 409 mapping

## Phase 6: Tests

- [ ] 6.1 Unit — `planting-spot-type.value-object.spec.ts`: valid enum accepted; invalid string throws domain error (SC-02)
- [ ] 6.2 Unit — `planting-spot.aggregate.spec.ts`: `create()` emits `PlantingSpotCreated`; `update()` emits `PlantingSpotUpdated` + field events; `delete()` emits `PlantingSpotDeleted`
- [ ] 6.3 Unit — `assert-planting-spot-not-in-use.service.spec.ts`: count=0 passes; count=1 throws `PlantingSpotInUseException` (SC-08)
- [ ] 6.4 Unit — `create-planting-spot.handler.spec.ts`: happy path saves + emits event (SC-01); invalid type rejected (SC-02)
- [ ] 6.5 Unit — `update-planting-spot.handler.spec.ts`: owner updates (SC-04); non-owner → 403 (SC-05); wrong space → 404 (SC-06)
- [ ] 6.6 Unit — `delete-planting-spot.handler.spec.ts`: owner + count=0 deletes (SC-07); count>0 → 409 (SC-08); non-owner → 403 (SC-09)
- [ ] 6.7 Unit — `planting-spot-find-by-id.handler.spec.ts`: found in space (SC-10); wrong space → 404 (SC-11)
- [ ] 6.8 Unit — `planting-spot-find-by-criteria.handler.spec.ts`: returns own space only (SC-12); type filter (SC-13); empty list → 200 (SC-14)
- [ ] 6.9 Integration — `planting-spot-tenant-isolation.spec.ts`: spot under S1 invisible under S2 using real `createTenantRepository` (SC-15)
- [ ] 6.10 Integration — `planting-spot-type-filter.spec.ts`: `findByCriteria({type:'pot'})` returns only pot spots (SC-13)
- [ ] 6.11 E2E — `planting-spots.e2e.spec.ts`: REST CRUD behind `JwtAuthGuard`+`SpaceGuard`; missing `X-Space-ID` → 400 (SC-03); creates, reads, updates, deletes; GraphQL equivalent operations
- [ ] 6.12 Static — `planting-spots-no-plants-import.spec.ts`: scan `src/contexts/planting-spots/**` — assert no import from `src/contexts/plants/` (SC-16)
