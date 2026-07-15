# Tasks: Care Schedule Module (`care-schedule`)

## Phase 1: Domain
- [x] 1.1 Enums: `CareScheduleActivityTypeEnum`, `CareScheduleUnitEnum`
- [x] 1.2 Value objects: id, plant-id is reused `UuidValueObject`; activity-type, interval-days (≥1), quantity (>0), unit, notes (≤2000), next-due-at, last-completed-at, active
- [x] 1.3 `ICareSchedule` interface (value-object shape) + `ICareSchedulePrimitives`
- [x] 1.4 `CareScheduleViewModel`
- [x] 1.5 Events: created, updated, completed, deleted + field-changed/{activity-type,interval-days,quantity,unit,notes,active}; event-data interfaces
- [x] 1.6 `CareScheduleAggregate` — create/update (Pick/Omit + change*), complete (advances nextDueAt), delete, toPrimitives, getters
- [x] 1.7 `CareScheduleBuilder` extends `BaseBuilder`
- [x] 1.8 Repositories read/write interfaces + DI tokens
- [x] 1.9 `CareScheduleNotFoundException`

## Phase 2: Application
- [x] 2.1 Commands: create, update, complete, delete (inputs as primitives, fields as VOs)
- [x] 2.2 Queries: find-by-id, find-by-criteria
- [x] 2.3 Assert services: write/assert-exists, read/assert-view-model-exists

## Phase 3: Infrastructure
- [x] 3.1 TypeORM entity `care_schedules`
- [x] 3.2 Mapper toDomain/toViewModel/toPersistence
- [x] 3.3 Tenant write repo + read repo (criteria filters: plant_id, activity_type, active, due_before)
- [x] 3.4 Migration `CreateCareSchedules`

## Phase 4: Transport + wiring
- [x] 4.1 REST controller + DTOs + mapper
- [x] 4.2 GraphQL resolvers (queries/mutations) + DTOs + response + registered enums + mapper
- [x] 4.3 MCP tools + schemas (create/update/complete/delete/find-by-id/find-by-criteria)
- [x] 4.4 Exception filter `resolveCareScheduleExceptionStatus`
- [x] 4.5 `CareScheduleModule`; register in `app.module.ts` and `base-exception.filter.ts`
- [x] 4.6 `README.md`

## Phase 4b: Care-log bridge (port + adapter)
- [x] 4b.1 `ICareLogPort` + `RecordCareLogEntryInput` in `application/ports/`
- [x] 4b.2 `CareLogAdapter` in `infrastructure/adapters/` dispatching `CreateCareLogEntryCommand`
- [x] 4b.3 `CompleteCareScheduleCommandHandler` depends on the port; best-effort recording
- [x] 4b.4 Register `{ provide: CARE_LOG_PORT, useClass: CareLogAdapter }` in the module
- [x] 4b.5 Adapter unit test; update no-cross-context spec to exclude `infrastructure/adapters/`

## Phase 5: Tests + verify
- [x] 5.1 Unit: aggregate, builder, value objects, handlers, mappers, resolvers
- [x] 5.2 `care-schedule-no-cross-context-import.spec.ts`
- [x] 5.3 Integration: read/write repos (tenant)
- [x] 5.4 E2E: REST + GraphQL flow
- [x] 5.5 Run `tsc --noEmit`, `pnpm lint`, `pnpm build`, `pnpm test`
