# Tasks: Harvest Module (`harvest-module`)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1 100 – 1 500 |
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
| 1 | Domain + Application layer (no I/O) | PR 1 | Aggregate, VOs, events, exceptions, commands, queries, assert services |
| 2 | Infrastructure layer + migration | PR 2 | TypeORM entity, mapper, write repo (tenant), read repo (tenant), migration |
| 3 | Transport + module wiring | PR 3 | REST controller + DTOs, GraphQL resolver + types, HarvestsModule, app.module.ts |
| 4 | Tests (unit + integration + e2e) | PR 4 | All test files |

---

## Phase 1: Domain

- [ ] 1.1 Create `src/contexts/harvests/domain/enums/harvest-unit.enum.ts` — `HarvestUnitEnum` (`KG`, `G`, `PIECES`, `LITERS`, `ML`, `BUNCHES`)
- [ ] 1.2 Create `src/contexts/harvests/domain/value-objects/harvest-id/harvest-id.value-object.ts` — extends `UuidValueObject`
- [ ] 1.3 Create `src/contexts/harvests/domain/value-objects/harvest-crop-type/harvest-crop-type.value-object.ts` — extends `StringValueObject`; trims; rejects empty/whitespace; max 200 chars
- [ ] 1.4 Create `src/contexts/harvests/domain/value-objects/harvest-quantity/harvest-quantity.value-object.ts` — extends `NumberValueObject`; rejects `<= 0`
- [ ] 1.5 Create `src/contexts/harvests/domain/value-objects/harvest-unit/harvest-unit.value-object.ts` — extends `EnumValueObject<typeof HarvestUnitEnum>`; validates in constructor
- [ ] 1.6 Create `src/contexts/harvests/domain/value-objects/harvest-harvested-at/harvest-harvested-at.value-object.ts` — wraps `Date`; rejects null/undefined
- [ ] 1.7 Create `src/contexts/harvests/domain/events/interfaces/harvest-event-data.interface.ts`
- [ ] 1.8 Create `src/contexts/harvests/domain/events/harvest-created/harvest-created.event.ts`
- [ ] 1.9 Create `src/contexts/harvests/domain/events/harvest-updated/harvest-updated.event.ts`
- [ ] 1.10 Create `src/contexts/harvests/domain/events/harvest-deleted/harvest-deleted.event.ts`
- [ ] 1.11 Create `src/contexts/harvests/domain/events/field-changed/crop-type-changed/crop-type-changed.event.ts`
- [ ] 1.12 Create `src/contexts/harvests/domain/events/field-changed/quantity-changed/quantity-changed.event.ts`
- [ ] 1.13 Create `src/contexts/harvests/domain/events/field-changed/unit-changed/unit-changed.event.ts`
- [ ] 1.14 Create `src/contexts/harvests/domain/events/field-changed/harvested-at-changed/harvested-at-changed.event.ts`
- [ ] 1.15 Create `src/contexts/harvests/domain/exceptions/harvest-not-found.exception.ts` — HTTP 404
- [ ] 1.16 Create `src/contexts/harvests/domain/interfaces/harvest.interface.ts` — `IHarvest` with VO-typed fields
- [ ] 1.17 Create `src/contexts/harvests/domain/primitives/harvest.primitives.ts` — `IHarvestPrimitives extends BasePrimitives`; all primitive types
- [ ] 1.18 Create `src/contexts/harvests/domain/view-models/harvest.view-model.ts` — `HarvestViewModel extends BaseViewModel`
- [ ] 1.19 Create `src/contexts/harvests/domain/repositories/write/harvest-write.repository.ts` — `IHarvestWriteRepository` + `HARVEST_WRITE_REPOSITORY` token
- [ ] 1.20 Create `src/contexts/harvests/domain/repositories/read/harvest-read.repository.ts` — `IHarvestReadRepository` + `HARVEST_READ_REPOSITORY` token; `HarvestCriteria` type with `cropType?`, `unit?`, `dateFrom?`, `dateTo?`, `page?`, `limit?`
- [ ] 1.21 Create `src/contexts/harvests/domain/aggregates/harvest.aggregate.ts` — `create()`, `update({cropType?,quantity?,unit?,harvestedAt?})`, `delete()`; emits events; per-field change events only when value differs; carries `userId`, `spaceId`
- [ ] 1.22 Create `src/contexts/harvests/domain/builders/harvest.builder.ts` — extends `BaseBuilder`; receives `IHarvestPrimitives`; wraps each field in VO

---

## Phase 2: Application

- [ ] 2.1 Create `src/contexts/harvests/application/services/write/assert-harvest-exists/assert-harvest-exists.service.ts` — loads from write repo; throws `HarvestNotFoundException` when null
- [ ] 2.2 Create `src/contexts/harvests/application/services/read/assert-harvest-view-model-exists/assert-harvest-view-model-exists.service.ts` — loads from read repo; throws `HarvestNotFoundException` when null
- [ ] 2.3 Create `src/contexts/harvests/application/commands/create-harvest/create-harvest.command.ts` — `CreateHarvestCommandInput` (primitive fields); command constructs VOs
- [ ] 2.4 Create `src/contexts/harvests/application/commands/create-harvest/create-harvest.handler.ts` — builds aggregate via builder; calls `create()`; saves via write repo; logs entry + completion; returns `harvestId`
- [ ] 2.5 Create `src/contexts/harvests/application/commands/update-harvest/update-harvest.command.ts`
- [ ] 2.6 Create `src/contexts/harvests/application/commands/update-harvest/update-harvest.handler.ts` — loads aggregate via `AssertHarvestExistsService`; calls `update()`; saves; emits `HarvestUpdated`; logs
- [ ] 2.7 Create `src/contexts/harvests/application/commands/delete-harvest/delete-harvest.command.ts`
- [ ] 2.8 Create `src/contexts/harvests/application/commands/delete-harvest/delete-harvest.handler.ts` — loads aggregate via `AssertHarvestExistsService`; calls `delete()`; removes from repo; logs
- [ ] 2.9 Create `src/contexts/harvests/application/queries/harvest-find-by-id/harvest-find-by-id.query.ts`
- [ ] 2.10 Create `src/contexts/harvests/application/queries/harvest-find-by-id/harvest-find-by-id.handler.ts` — uses `AssertHarvestViewModelExistsService`; returns `HarvestViewModel`; logs at entry
- [ ] 2.11 Create `src/contexts/harvests/application/queries/harvest-find-by-criteria/harvest-find-by-criteria.query.ts` — includes `cropType?`, `unit?`, `dateFrom?`, `dateTo?`, `page`, `limit`
- [ ] 2.12 Create `src/contexts/harvests/application/queries/harvest-find-by-criteria/harvest-find-by-criteria.handler.ts` — always scoped to `spaceId`; passes criteria to read repo; empty list returns `[]`; logs at entry

---

## Phase 3: Infrastructure

- [ ] 3.1 Create `src/contexts/harvests/infrastructure/persistence/typeorm/entities/harvest.entity.ts` — `harvests` table; columns: `id` (uuid pk), `crop_type` (varchar 200), `quantity` (decimal 10,3), `unit` (varchar), `harvested_at` (timestamptz), `user_id` (uuid), `space_id` (uuid NOT NULL), `created_at`, `updated_at`; `@Index('IDX_harvests_space_id', ['spaceId'])`
- [ ] 3.2 Create `src/contexts/harvests/infrastructure/persistence/typeorm/mappers/harvest-typeorm.mapper.ts` — `toDomain(entity): IHarvestPrimitives` + `toPersistence(aggregate): HarvestEntity`; `quantity` stored/read as string, parsed with `parseFloat`
- [ ] 3.3 Create `src/contexts/harvests/infrastructure/persistence/typeorm/repositories/harvest-typeorm-write.repository.ts` — extends `BaseDatabaseRepository`; `this.repository = createTenantRepository(rawRepo, spaceContext)` in constructor; implements `IHarvestWriteRepository`
- [ ] 3.4 Create `src/contexts/harvests/infrastructure/persistence/typeorm/repositories/harvest-typeorm-read.repository.ts` — extends `BaseDatabaseRepository`; `createTenantRepository` pattern; implements `IHarvestReadRepository`; `findByCriteria` builds query with `cropType` ILIKE, `unit` exact, `harvested_at` range; pagination default page=1, limit=20, max=100
- [ ] 3.5 Create `src/database/migrations/1780000000015-CreateHarvests.ts` — `up()` creates `harvests` table + `IDX_harvests_space_id`; `down()` drops table

---

## Phase 4: Transport

- [ ] 4.1 Create `src/contexts/harvests/transport/rest/dtos/create-harvest.dto.ts` — `cropType` (string, required), `quantity` (number, required), `unit` (HarvestUnitEnum, required), `harvestedAt` (ISO string → Date, required)
- [ ] 4.2 Create `src/contexts/harvests/transport/rest/dtos/update-harvest.dto.ts` — all fields optional; PartialType of create DTO
- [ ] 4.3 Create `src/contexts/harvests/transport/rest/dtos/harvest-rest-response.dto.ts` — all `HarvestViewModel` fields
- [ ] 4.4 Create `src/contexts/harvests/transport/rest/mappers/harvest/harvest.mapper.ts` — `HarvestViewModel → HarvestRestResponseDto`
- [ ] 4.5 Create `src/contexts/harvests/transport/rest/controllers/harvests.controller.ts` — routes: `POST /harvests` (201), `GET /harvests` (200), `GET /harvests/:id` (200), `PATCH /harvests/:id` (200), `DELETE /harvests/:id` (200); guards: `JwtAuthGuard` + `SpaceGuard`; `@CurrentUser` → `userId`; log at each entry point
- [ ] 4.6 Create `src/contexts/harvests/transport/graphql/enums/harvest-registered-enums.graphql.ts` — `registerEnumType(HarvestUnitEnum, { name: 'HarvestUnit' })`
- [ ] 4.7 Create `src/contexts/harvests/transport/graphql/dtos/requests/create-harvest-graphql.dto.ts` — `@InputType()` with `cropType`, `quantity`, `unit`, `harvestedAt`
- [ ] 4.8 Create `src/contexts/harvests/transport/graphql/dtos/requests/update-harvest-graphql.dto.ts` — `@InputType()` with all fields optional + `id`
- [ ] 4.9 Create `src/contexts/harvests/transport/graphql/dtos/requests/harvest-criteria-graphql.dto.ts` — `@InputType()` with `cropType?`, `unit?`, `dateFrom?`, `dateTo?`, `page?`, `limit?`
- [ ] 4.10 Create `src/contexts/harvests/transport/graphql/dtos/responses/harvest.response.dto.ts` — `@ObjectType()` with all `HarvestViewModel` fields; `unit` typed as registered `HarvestUnit` enum
- [ ] 4.11 Create `src/contexts/harvests/transport/graphql/mappers/harvest.mapper.ts` — `HarvestViewModel → HarvestResponseDto`
- [ ] 4.12 Create `src/contexts/harvests/transport/graphql/resolvers/harvest-queries.resolver.ts` — `harvest(id: ID!): HarvestType`, `harvests(criteria): PaginatedHarvestsResult`; guards: `JwtAuthGuard` + `SpaceGuard`; dispatches via `QueryBus` only; log at entry
- [ ] 4.13 Create `src/contexts/harvests/transport/graphql/resolvers/harvest-mutations.resolver.ts` — `createHarvest`, `updateHarvest`, `deleteHarvest`; same guards; dispatches via `CommandBus` only; log at entry

---

## Phase 5: Module Wiring

- [ ] 5.1 Create `src/contexts/harvests/harvests.module.ts` — providers grouped as `COMMAND_HANDLERS`, `QUERY_HANDLERS`, `APPLICATION_SERVICES`, `DOMAIN_BUILDERS`, `INFRASTRUCTURE_REPOSITORIES`, `INFRASTRUCTURE_MAPPERS`, `INFRASTRUCTURE_ENTITIES`, `TRANSPORT_PROVIDERS`; write repo bound to `HARVEST_WRITE_REPOSITORY`; read repo bound to `HARVEST_READ_REPOSITORY`; `TypeOrmModule.forFeature([HarvestEntity])`; `CqrsModule` imported
- [ ] 5.2 Modify `src/app.module.ts` — add `HarvestsModule` to `imports[]`

---

## Phase 6: Tests

- [ ] 6.1 Unit — `harvest-unit.value-object.spec.ts`: valid enum values accepted; invalid string throws domain error
- [ ] 6.2 Unit — `harvest-crop-type.value-object.spec.ts`: non-empty trimmed string accepted; empty/whitespace throws
- [ ] 6.3 Unit — `harvest-quantity.value-object.spec.ts`: positive decimal accepted; 0 and negative throw
- [ ] 6.4 Unit — `harvest.aggregate.spec.ts`: `create()` emits `HarvestCreated`; `update()` emits `HarvestUpdated` + field change events only when value differs; `delete()` emits `HarvestDeleted`
- [ ] 6.5 Unit — `create-harvest.handler.spec.ts`: happy path saves aggregate + returns harvestId; invalid cropType → throws; quantity=0 → throws
- [ ] 6.6 Unit — `update-harvest.handler.spec.ts`: updates fields and saves; harvestId not found → 404
- [ ] 6.7 Unit — `delete-harvest.handler.spec.ts`: deletes aggregate; harvestId not found → 404
- [ ] 6.8 Unit — `harvest-find-by-id.handler.spec.ts`: found → returns ViewModel; not found → 404
- [ ] 6.9 Unit — `harvest-find-by-criteria.handler.spec.ts`: delegates criteria to read repo; empty result → `[]`
- [ ] 6.10 Integration — `harvest-typeorm-write.repository.integration-spec.ts` + `harvest-typeorm-read.repository.integration-spec.ts`: tenant isolation (harvest under S1 invisible under S2); `cropType` ILIKE filter; `unit` exact filter; `dateFrom`/`dateTo` range; `decimal(10,3)` round-trip for quantity
- [ ] 6.11 E2E — `harvests-rest.e2e-spec.ts`: REST CRUD behind `JwtAuthGuard` + `SpaceGuard`; invalid unit → 400; quantity=0 → 400; creates, reads, updates, deletes; cross-tenant → 404
- [ ] 6.12 E2E — `harvests-graphql.e2e-spec.ts`: GraphQL `createHarvest`, `harvest(id)`, `harvests(criteria)`, `updateHarvest`, `deleteHarvest`; guards enforced
- [ ] 6.13 Static — `harvests-no-cross-context-import.spec.ts`: scan `src/contexts/harvests/**` — assert no import from `@contexts/plants/` or `@contexts/plant-species/`
