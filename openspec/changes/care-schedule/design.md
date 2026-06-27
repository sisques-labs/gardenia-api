# Design: Care Schedule Module (`care-schedule`)

## Architecture

Standard DDD + CQRS + Hexagonal layering, identical in shape to the `inventory`
context. One aggregate root, `CareScheduleAggregate`, persisted to a single
`care_schedules` table, tenant-scoped through `createTenantRepository`.

```
domain
  aggregates/        CareScheduleAggregate
  builders/          CareScheduleBuilder (extends BaseBuilder)
  enums/             CareScheduleActivityTypeEnum, CareScheduleUnitEnum
  events/            created, updated, completed, deleted + field-changed/*
  exceptions/        CareScheduleNotFoundException
  interfaces/        ICareSchedule (value-object shape)
  primitives/        ICareSchedulePrimitives (serialized shape)
  repositories/      read/write interfaces + DI tokens
  value-objects/     id, activity-type, interval-days, quantity, unit, notes,
                     next-due-at, last-completed-at, active
  view-models/       CareScheduleViewModel
application
  commands/          create, update, complete, delete
  queries/           find-by-id, find-by-criteria
  ports/             care-log.port (ICareLogPort) + record-care-log-entry.input
  services/          read/assert-…-view-model-exists, write/assert-…-exists
infrastructure
  adapters/          care-log.adapter (→ care-log CreateCareLogEntryCommand)
  persistence/typeorm/ entity, mapper, read repo, write repo
transport
  exceptions/        resolveCareScheduleExceptionStatus
  graphql/ rest/ mcp/
```

## Aggregate behaviour

`CareScheduleAggregate` follows the inventory pattern exactly:

- **Constructor** = hydration only (assigns value objects from `ICareSchedule`).
- **`create()`** applies `CareScheduleCreatedEvent` with `toPrimitives()`.
- **`update(props)`** takes
  `Partial<Omit<ICareSchedule, 'id' | 'plantId' | 'nextDueAt' | 'lastCompletedAt' | 'userId' | 'spaceId' | 'createdAt' | 'updatedAt'>>`
  and delegates to private `change*` methods (one per mutable field:
  `activityType`, `intervalDays`, `quantity`, `unit`, `notes`, `active`). Each
  `change*` method no-ops when the value is unchanged, otherwise reassigns,
  calls `touch()`, and applies the matching `*ChangedEvent`
  (`IFieldChangedEventData<T>`). After delegating, `update()` applies
  `CareScheduleUpdatedEvent`.
- **`complete(completedAt)`** is the domain-specific action (analogous to
  inventory's `adjustQuantity`): it sets `lastCompletedAt = completedAt` and
  recomputes `nextDueAt = completedAt + intervalDays days`, calls `touch()`, and
  applies `CareScheduleCompletedEvent` carrying `{ id, completedAt, nextDueAt }`.
- **`delete()`** applies `CareScheduleDeletedEvent` with `toPrimitives()`.

`nextDueAt` and `lastCompletedAt` are never mutated by `update()` — only by
`complete()` — which is why they are in the `Omit` set.

## Next-due computation

`nextDueAt` after completion = `completedAt + intervalDays` whole days, computed
in the domain via a pure helper on the aggregate. The *initial* `nextDueAt` is
supplied by the caller at creation time (the first scheduled date), defaulting to
"now" in the create handler when omitted.

## Tenant isolation

Both repositories wrap the raw TypeORM repo with `createTenantRepository(rawRepo,
spaceContext)`. The read repository's `findByCriteria` additionally filters by
`space_id` and supports `plant_id` (EQUALS), `activity_type` (EQUALS), `active`
(EQUALS), and a `due_before` cross-field filter (`next_due_at <= :value`).

## Persistence

Table `care_schedules`:

| column | type | notes |
|--------|------|-------|
| id | uuid PK | `uuid_generate_v4()` |
| plant_id | uuid NOT NULL | indexed (no FK — mirrors care-log) |
| activity_type | varchar(32) NOT NULL | |
| interval_days | integer NOT NULL | ≥ 1 |
| quantity | decimal(10,3) NULL | > 0 when present |
| unit | varchar(8) NULL | |
| notes | text NULL | |
| next_due_at | timestamptz NOT NULL | indexed |
| last_completed_at | timestamptz NULL | |
| active | boolean NOT NULL DEFAULT true | |
| user_id | uuid NOT NULL | FK → users(id) ON DELETE CASCADE |
| space_id | uuid NOT NULL | indexed, FK → spaces(id) ON DELETE CASCADE |
| created_at / updated_at | timestamptz | |

Indexes: `space_id`; `(plant_id, space_id)`; `(space_id, active, next_due_at)`
to serve the "what's due in this space" query efficiently.

## Care-log bridge (port + adapter)

A completed schedule is a performed care activity, so completion mirrors itself
into the `care-log` context. Following the project's cross-context rule, this is
the only outward dependency and lives entirely behind a port:

- `ICareLogPort` (`application/ports/care-log.port.ts`) with
  `recordCareLogEntry(input)`; the input shape is its own file
  (`record-care-log-entry.input.ts`).
- `CareLogAdapter` (`infrastructure/adapters/care-log.adapter.ts`) implements the
  port by dispatching `CreateCareLogEntryCommand` on the Command bus. This is the
  only file in the context that imports `@contexts/care-log`.
- `CompleteCareScheduleCommandHandler` depends on the port (injected via
  `CARE_LOG_PORT`), never on `care-log` directly.

The bridge is **best-effort**: completion (advancing `nextDueAt`, persisting,
publishing events) is authoritative and happens first; the care-log write is
attempted afterwards inside a try/catch that logs a warning on failure. There is
no cross-context transaction — the schedule is the source of truth and the
care-log entry is a derived convenience. `activityType` and `unit` map across
unchanged because both contexts share the same enum value sets.

## No cross-context coupling (outside adapters)

Outside `infrastructure/adapters/`, `care-schedule` references a plant only by
raw `plantId: UuidValueObject` and imports nothing from other contexts. Enforced
by `care-schedule-no-cross-context-import.spec.ts`, which excludes the adapters
directory (the sanctioned boundary).

## Decisions

- **Care-log bridge included, notifications deferred.** Creating `care-log`
  entries on completion is implemented here via the port/adapter so the two
  contexts actually work together. Reminder *delivery* (push/email) still pulls
  in a notifications substrate and stays a follow-up — the
  `CareScheduleCompletedEvent` already carries the data a future consumer needs.
- **`complete()` as an explicit action, not an `update`.** Advancing the cadence
  is a domain operation with its own event and invariant (next due is derived,
  not user-set), so it gets a dedicated command/method like `adjustQuantity`.
