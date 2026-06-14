# Tasks: CareLog bounded context

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2 000 – 2 600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → Domain + Application · PR 2 → Infrastructure + Migration · PR 3 → Transport + Module wiring · PR 4 → Cross-context (plants) · PR 5 → Tests |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + Application layer (no I/O) | PR 1 | Aggregate, VOs, enums, events, exceptions, ports, commands, queries, assert services |
| 2 | Infrastructure layer + migration | PR 2 | TypeORM entity, mapper, write repo, read repo, migration |
| 3 | Transport + module wiring | PR 3 | REST controller + DTOs, GraphQL resolver + types, CareLogModule, app.module.ts |
| 4 | Cross-context plants integration | PR 4 | ICareLogPort, CareLogAdapter, resolved field resolver, PlantResponseDto update, PlantsModule update |
| 5 | Tests (unit + integration + e2e) | PR 5 | All test files; references SC-01 → SC-17 |

---

## Phase 1: Domain

- [ ] 1.1 Create `src/contexts/care-log/domain/enums/care-log-activity-type.enum.ts` — `CareLogActivityTypeEnum` with values `WATERING`, `FERTILIZING`, `PRUNING`, `REPOTTING`, `TRANSPLANTING`, `PEST_TREATMENT`, `MISTING`, `ROTATION`, `OTHER`
- [ ] 1.2 Create `src/contexts/care-log/domain/enums/care-log-unit.enum.ts` — `CareLogUnitEnum` with values `ML`, `L`, `G`, `KG`
- [ ] 1.3 Create `src/contexts/care-log/domain/value-objects/care-log-id/care-log-id.value-object.ts` — extends `UuidValueObject`
- [ ] 1.4 Create `src/contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object.ts` — extends `EnumValueObject<typeof CareLogActivityTypeEnum>`; validates in constructor
- [ ] 1.5 Create `src/contexts/care-log/domain/value-objects/care-log-unit/care-log-unit.value-object.ts` — extends `EnumValueObject<typeof CareLogUnitEnum>`; validates in constructor
- [ ] 1.6 Create `src/contexts/care-log/domain/value-objects/care-log-notes/care-log-notes.value-object.ts` — extends `StringValueObject`; non-empty when set; max 2000 chars
- [ ] 1.7 Create `src/contexts/care-log/domain/value-objects/care-log-quantity/care-log-quantity.value-object.ts` — extends `NumberValueObject`; must be positive
- [ ] 1.8 Create `src/contexts/care-log/domain/value-objects/care-log-performed-at/care-log-performed-at.value-object.ts` — wraps `Date`; constructor throws domain error if `value > new Date()` (future guard)
- [ ] 1.9 Create `src/contexts/care-log/domain/events/interfaces/care-log-event-data.interface.ts` — `ICareLogEventData { id, plantId, userId, spaceId, activityType, performedAt }`
- [ ] 1.10 Create `src/contexts/care-log/domain/events/care-log-entry-created/care-log-entry-created.event.ts` — implements `ICareLogEventData`
- [ ] 1.11 Create `src/contexts/care-log/domain/events/care-log-entry-updated/care-log-entry-updated.event.ts`
- [ ] 1.12 Create `src/contexts/care-log/domain/events/care-log-entry-deleted/care-log-entry-deleted.event.ts`
- [ ] 1.13 Create `src/contexts/care-log/domain/exceptions/care-log-entry-not-found.exception.ts` — HTTP 404
- [ ] 1.14 Create `src/contexts/care-log/domain/exceptions/care-log-entry-forbidden.exception.ts` — HTTP 403
- [ ] 1.15 Create `src/contexts/care-log/domain/exceptions/care-log-quantity-unit-mismatch.exception.ts` — HTTP 422; thrown when one of quantity/unit is set without the other
- [ ] 1.16 Create `src/contexts/care-log/domain/interfaces/care-log-entry.interface.ts` — all fields as value objects
- [ ] 1.17 Create `src/contexts/care-log/domain/primitives/care-log-entry.primitives.ts` — `ICareLogEntryPrimitives` extends `BasePrimitives`; all raw types; `ICareLogEntryBasePrimitives` for partial update input
- [ ] 1.18 Create `src/contexts/care-log/domain/view-models/care-log-entry.view-model.ts` — `CareLogEntryViewModel` extends `BaseViewModel`; all raw primitive fields
- [ ] 1.19 Create `src/contexts/care-log/domain/repositories/write/care-log-entry-write.repository.ts` — `ICareLogEntryWriteRepository` + `CARE_LOG_ENTRY_WRITE_REPOSITORY` token; exposes `save()` and `findById(id, spaceId)`
- [ ] 1.20 Create `src/contexts/care-log/domain/repositories/read/care-log-entry-read.repository.ts` — `ICareLogEntryReadRepository` + `CARE_LOG_ENTRY_READ_REPOSITORY` token; exposes `findById`, `findByPlant`, `findBySpace`, `findLastByType`; includes `Pagination` and `CareLogSpaceCriteria` types
- [ ] 1.21 Create `src/contexts/care-log/domain/aggregates/care-log-entry.aggregate.ts` — `create(props)` (validates quantity+unit pair, performedAt future guard, emits `CareLogEntryCreated`); `update(patch)` (ownership check by passing `userId` from context, emits `CareLogEntryUpdated`); `delete()` (emits `CareLogEntryDeleted`); all fields are value objects; constructor = hydration only
- [ ] 1.22 Create `src/contexts/care-log/domain/builders/care-log-entry.builder.ts` — extends `BaseBuilder`; fluent API (`withPlantId`, `withActivityType`, `withPerformedAt`, `withNotes`, `withQuantity`, `withUnit`, `withUserId`, `withSpaceId`); `buildAggregate()` + `buildViewModel()`

## Phase 2: Application

- [ ] 2.1 Create `src/contexts/care-log/application/services/write/assert-care-log-entry-exists/assert-care-log-entry-exists.service.ts` — injects `ICareLogEntryWriteRepository`; throws `CareLogEntryNotFoundException` when aggregate is null
- [ ] 2.2 Create `src/contexts/care-log/application/services/read/assert-care-log-entry-view-model-exists/assert-care-log-entry-view-model-exists.service.ts` — injects `ICareLogEntryReadRepository`; throws `CareLogEntryNotFoundException` when VM is null
- [ ] 2.3 Create `src/contexts/care-log/application/commands/create-care-log-entry/create-care-log-entry.command.ts` — `CreateCareLogEntryCommandInput` interface (primitives: `plantId`, `userId`, `spaceId`, `activityType`, `performedAt?`, `notes?`, `quantity?`, `unit?`); `CreateCareLogEntryCommand` with VO fields constructed from input in constructor
- [ ] 2.4 Create `src/contexts/care-log/application/commands/create-care-log-entry/create-care-log-entry.handler.ts` — builds aggregate via builder; sets `performedAt` to `new Date()` when not provided; saves; publishes events; logs completion
- [ ] 2.5 Create `src/contexts/care-log/application/commands/update-care-log-entry/update-care-log-entry.command.ts` — input with `id`, `userId`, `spaceId`, and partial update fields
- [ ] 2.6 Create `src/contexts/care-log/application/commands/update-care-log-entry/update-care-log-entry.handler.ts` — uses `AssertCareLogEntryExistsService`; checks `aggregate.userId.value === command.userId` → 403; calls `aggregate.update(patch)`; saves; publishes events
- [ ] 2.7 Create `src/contexts/care-log/application/commands/delete-care-log-entry/delete-care-log-entry.command.ts`
- [ ] 2.8 Create `src/contexts/care-log/application/commands/delete-care-log-entry/delete-care-log-entry.handler.ts` — uses `AssertCareLogEntryExistsService`; ownership check → 403; calls `aggregate.delete()`; saves; publishes events
- [ ] 2.9 Create `src/contexts/care-log/application/queries/care-log-find-by-plant/care-log-find-by-plant.query.ts` — input: `plantId`, `spaceId`, `page?`, `limit?`
- [ ] 2.10 Create `src/contexts/care-log/application/queries/care-log-find-by-plant/care-log-find-by-plant.handler.ts` — calls `readRepository.findByPlant()`; returns `CareLogEntryViewModel[]`; logs at entry
- [ ] 2.11 Create `src/contexts/care-log/application/queries/care-log-find-by-space/care-log-find-by-space.query.ts` — input: `spaceId`, optional `activityTypes[]`, `fromDate`, `toDate`, `page?`, `limit?`
- [ ] 2.12 Create `src/contexts/care-log/application/queries/care-log-find-by-space/care-log-find-by-space.handler.ts` — calls `readRepository.findBySpace()`; returns `CareLogEntryViewModel[]`
- [ ] 2.13 Create `src/contexts/care-log/application/queries/care-log-find-last-by-type/care-log-find-last-by-type.query.ts` — input: `plantId`, `spaceId`, `activityType`
- [ ] 2.14 Create `src/contexts/care-log/application/queries/care-log-find-last-by-type/care-log-find-last-by-type.handler.ts` — calls `readRepository.findLastByType()`; returns `CareLogEntryViewModel | null`

## Phase 3: Infrastructure

- [ ] 3.1 Create `src/contexts/care-log/infrastructure/persistence/typeorm/entities/care-log-entry.entity.ts` — `care_log_entries` table; columns: `id`, `plant_id`, `user_id`, `space_id`, `activity_type` (varchar 32), `performed_at` (TIMESTAMPTZ), `notes` (text, nullable), `quantity` (decimal 10,3, nullable), `unit` (varchar 8, nullable), `created_at`, `updated_at`; indexes: `@Index('IDX_care_log_entries_space_id')` on `space_id`, `@Index('IDX_care_log_entries_plant_id_space_id')` on `(plant_id, space_id)`, `@Index('IDX_care_log_entries_performed_at')` on `(plant_id, space_id, performed_at)`
- [ ] 3.2 Create `src/contexts/care-log/infrastructure/persistence/typeorm/mappers/care-log-entry-typeorm.mapper.ts` — `toDomain(entity): CareLogEntryAggregate` via builder; `toPersistence(aggregate): CareLogEntryEntity` via `toPrimitives()`
- [ ] 3.3 Create `src/contexts/care-log/infrastructure/persistence/typeorm/repositories/care-log-entry-typeorm-write.repository.ts` — extends `BaseDatabaseRepository`; constructor calls `createTenantRepository(rawRepo, spaceContext)`; implements `ICareLogEntryWriteRepository`; `save()` uses `toPersistence`; `findById()` uses `toDomain`
- [ ] 3.4 Create `src/contexts/care-log/infrastructure/persistence/typeorm/repositories/care-log-entry-typeorm-read.repository.ts` — extends `BaseDatabaseRepository`; `createTenantRepository` pattern; implements `ICareLogEntryReadRepository`; `findByPlant()` filters by `plant_id`, orders by `performed_at DESC`, paginates (default `page=1`, `limit=20`, max `100`); `findBySpace()` supports `activityTypes` (IN clause), `fromDate`/`toDate` (BETWEEN on `performed_at`), pagination; `findLastByType()` adds `WHERE activity_type = :type ORDER BY performed_at DESC LIMIT 1`
- [ ] 3.5 Create `src/database/migrations/1780000000016-CreateCareLog.ts` — `up()` creates `care_log_entries` with all columns and three indexes; `down()` drops table

## Phase 4: Transport

- [ ] 4.1 Create `src/contexts/care-log/transport/rest/dtos/create-care-log-entry.dto.ts` — `plantId` (IsUUID, required), `activityType` (IsEnum CareLogActivityTypeEnum, required), `performedAt` (IsDate, IsOptional), `notes` (IsString, MaxLength 2000, IsOptional), `quantity` (IsNumber, IsPositive, IsOptional), `unit` (IsEnum CareLogUnitEnum, IsOptional)
- [ ] 4.2 Create `src/contexts/care-log/transport/rest/dtos/update-care-log-entry.dto.ts` — all fields optional; same validations
- [ ] 4.3 Create `src/contexts/care-log/transport/rest/dtos/care-log-rest-response.dto.ts`
- [ ] 4.4 Create `src/contexts/care-log/transport/rest/mappers/care-log/care-log.mapper.ts` — `CareLogEntryViewModel → CareLogRestResponseDto`
- [ ] 4.5 Create `src/contexts/care-log/transport/rest/controllers/care-log.controller.ts` — routes: `POST /care-log`, `PATCH /care-log/:id`, `DELETE /care-log/:id`, `GET /care-log/:id`, `GET /care-log/plant/:plantId`, `GET /care-log`; guards: `JwtAuthGuard` + `SpaceGuard`; inject `userId` + `spaceId` from auth context; log at entry of each method; dispatch commands/queries via `CommandBus`/`QueryBus`
- [ ] 4.6 Create `src/contexts/care-log/transport/graphql/enums/care-log-registered-enums.graphql.ts` — `registerEnumType(CareLogActivityTypeEnum, ...)` + `registerEnumType(CareLogUnitEnum, ...)`
- [ ] 4.7 Create `src/contexts/care-log/transport/graphql/dtos/requests/create-care-log-entry-graphql.dto.ts` — `@InputType()`; same fields as REST create DTO
- [ ] 4.8 Create `src/contexts/care-log/transport/graphql/dtos/requests/update-care-log-entry-graphql.dto.ts` — `@InputType()`; all optional
- [ ] 4.9 Create `src/contexts/care-log/transport/graphql/dtos/requests/care-log-find-by-space-graphql.dto.ts` — `@InputType()`; optional `activityTypes[]`, `fromDate`, `toDate`, `page`, `limit`
- [ ] 4.10 Create `src/contexts/care-log/transport/graphql/dtos/responses/care-log-entry.response.dto.ts` — `@ObjectType('CareLogEntryResponseDto')`; all fields with `@Field()`; includes `PaginatedCareLogResultDto extends BasePaginatedResultDto`
- [ ] 4.11 Create `src/contexts/care-log/transport/graphql/mappers/care-log/care-log.mapper.ts` — `CareLogEntryViewModel → CareLogEntryResponseDto`
- [ ] 4.12 Create `src/contexts/care-log/transport/graphql/resolvers/care-log-mutations.resolver.ts` — `createCareLogEntry`, `updateCareLogEntry`, `deleteCareLogEntry` (returns `Boolean`); guards: `JwtAuthGuard` + `SpaceGuard`; `CommandBus` only; logs at entry
- [ ] 4.13 Create `src/contexts/care-log/transport/graphql/resolvers/care-log-queries.resolver.ts` — `careLogEntry(id)`, `careLogEntriesByPlant(plantId, page?, limit?)`, `careLogEntriesBySpace(criteria?)`; guards: `JwtAuthGuard` + `SpaceGuard`; `QueryBus` only; logs at entry

## Phase 5: Module Wiring

- [ ] 5.1 Create `src/contexts/care-log/care-log.module.ts` — group providers into named const arrays: `COMMAND_HANDLERS`, `QUERY_HANDLERS`, `APPLICATION_SERVICES`, `DOMAIN_BUILDERS`, `INFRASTRUCTURE_REPOSITORIES` (bound to `CARE_LOG_ENTRY_WRITE_REPOSITORY` and `CARE_LOG_ENTRY_READ_REPOSITORY`), `INFRASTRUCTURE_MAPPERS`, `INFRASTRUCTURE_ENTITIES`, `TRANSPORT_PROVIDERS`; import `TypeOrmModule.forFeature([CareLogEntryEntity])`; import `CqrsModule`
- [ ] 5.2 Modify `src/app.module.ts` — add `CareLogModule` to `imports[]`; add import for `@contexts/care-log/care-log.module`
- [ ] 5.3 Import the enum registration file `care-log-registered-enums.graphql.ts` in the main enum registration (check existing pattern in `src/core/transport/graphql/registered-enums.graphql.ts`)

## Phase 6: Cross-context Integration (plants context)

- [ ] 6.1 Create `src/contexts/plants/application/ports/care-log.port.ts` — `export const CARE_LOG_PORT = Symbol('CARE_LOG_PORT')` + `ICareLogPort { findLastPerformedAt(plantId, spaceId, activityType): Promise<Date | null> }`
- [ ] 6.2 Create `src/contexts/plants/infrastructure/adapters/care-log.adapter.ts` — `CareLogAdapter implements ICareLogPort`; constructor injects `QueryBus`; `findLastPerformedAt()` dispatches `CareLogFindLastByTypeQuery` and returns `vm?.performedAt ?? null`; logs at entry and on not-found
- [ ] 6.3 Modify `src/contexts/plants/transport/graphql/dtos/responses/plant/plant.response.dto.ts` — add `@Field(() => Date, { nullable: true }) lastWateredAt?: Date | null` and `@Field(() => Date, { nullable: true }) lastFertilizedAt?: Date | null` to `PlantResponseDto`
- [ ] 6.4 Create `src/contexts/plants/transport/graphql/resolvers/plant/plant-care-log-resolved-fields.resolver.ts` — `@UseGuards(JwtAuthGuard)` + `@Resolver(() => PlantResponseDto)`; `@ResolveField('lastWateredAt', () => Date, { nullable: true })` calls `careLogPort.findLastPerformedAt(plant.id, plant.spaceId, 'WATERING')`; `@ResolveField('lastFertilizedAt', () => Date, { nullable: true })` same for `'FERTILIZING'`; inject `@Inject(CARE_LOG_PORT) private readonly careLogPort: ICareLogPort`
- [ ] 6.5 Modify `src/contexts/plants/plants.module.ts` — add `CareLogAdapter` to the infrastructure providers array; bind to `CARE_LOG_PORT` using `{ provide: CARE_LOG_PORT, useClass: CareLogAdapter }`; add `PlantCareLogResolvedFieldsResolver` to transport providers; import `@contexts/plants/application/ports/care-log.port` token

## Phase 7: Context READMEs

- [ ] 7.1 Create `src/contexts/care-log/README.md` — document the context purpose, aggregate fields, commands, queries, events, transport (REST + GraphQL), tenant isolation pattern, and cross-context contract (`ICareLogPort` consumed by plants). Follow `src/contexts/auth/README.md` as template.
- [ ] 7.2 Update `src/contexts/plants/README.md` — add section documenting `ICareLogPort`, `CareLogAdapter`, and the new `lastWateredAt` / `lastFertilizedAt` resolved fields.

## Phase 8: Tests

- [ ] 8.1 Unit — `care-log-activity-type.value-object.spec.ts`: valid enum accepted; invalid string throws domain error (SC-02)
- [ ] 8.2 Unit — `care-log-unit.value-object.spec.ts`: valid enum accepted; invalid string throws
- [ ] 8.3 Unit — `care-log-performed-at.value-object.spec.ts`: past date accepted; future date throws domain error (SC-06)
- [ ] 8.4 Unit — `care-log-entry.aggregate.spec.ts`: `create()` with valid args emits `CareLogEntryCreated` (SC-01); quantity without unit throws `CareLogQuantityUnitMismatchException` (SC-04); unit without quantity throws (SC-05); `update()` emits `CareLogEntryUpdated`; `delete()` emits `CareLogEntryDeleted`
- [ ] 8.5 Unit — `create-care-log-entry.handler.spec.ts`: happy path saves + emits event (SC-01, SC-03); `performedAt` defaults to now when omitted; invalid type rejected (SC-02)
- [ ] 8.6 Unit — `update-care-log-entry.handler.spec.ts`: author updates (SC-07); non-author → 403 (SC-08); wrong space → 404
- [ ] 8.7 Unit — `delete-care-log-entry.handler.spec.ts`: author deletes (SC-09); non-author → 403 (SC-10)
- [ ] 8.8 Unit — `care-log-find-by-plant.handler.spec.ts`: returns list for plant in space; empty list returns `[]`
- [ ] 8.9 Unit — `care-log-find-last-by-type.handler.spec.ts`: returns VM when found (SC-13); returns null when none (SC-14)
- [ ] 8.10 Unit — `assert-care-log-entry-exists.service.spec.ts`: null aggregate → throws `CareLogEntryNotFoundException`
- [ ] 8.11 Unit — `care-log.adapter.spec.ts` (plants context): dispatches `CareLogFindLastByTypeQuery`; maps `performedAt` to `Date`; returns `null` when query returns null (SC-14)
- [ ] 8.12 Integration — `care-log-entry-typeorm-write.repository.integration-spec.ts`: save + findById within same space; findById with wrong spaceId → null (SC-15)
- [ ] 8.13 Integration — `care-log-entry-typeorm-read.repository.integration-spec.ts`: `findByPlant` ordering desc (SC-11); `findBySpace` with date range (SC-12); `findLastByType` returns most recent (SC-13); tenant isolation (SC-15)
- [ ] 8.14 E2E — `care-log-rest.e2e-spec.ts`: POST creates entry (SC-01); invalid type → 400 (SC-02); PATCH by author → 200 (SC-07); PATCH by other user → 403 (SC-08); DELETE by author → 200 (SC-09); GET list by plant → ordered (SC-11); tenant isolation → 404 (SC-15)
- [ ] 8.15 E2E — `care-log-graphql.e2e-spec.ts`: `createCareLogEntry` mutation (SC-01); `careLogEntriesByPlant` query (SC-11); `lastWateredAt` resolved field on plant (SC-16); no-token → unauthorized
- [ ] 8.16 Static — `care-log-no-plants-import.spec.ts`: scan `src/contexts/care-log/**` — assert no import from `src/contexts/plants/` (SC-17)
