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
  services/          read/assert-…-view-model-exists, write/assert-…-exists
infrastructure
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

## No cross-context coupling

`care-schedule` references a plant only by raw `plantId: UuidValueObject`. It
imports nothing from `@contexts/plants`, `@contexts/plant-species`,
`@contexts/care-log`, or `@contexts/inventory`. Enforced by a
`care-schedule-no-cross-context-import.spec.ts` mirroring the inventory test.

## Decisions

- **Standalone over integrated.** Creating `care-log` entries on completion, and
  emitting reminders, are real value but pull in cross-context ports and a
  notifications substrate. Shipping the schedule first keeps the change reviewable
  and unblocks those follow-ups (the `CareScheduleCompletedEvent` already carries
  the data a future consumer needs).
- **`complete()` as an explicit action, not an `update`.** Advancing the cadence
  is a domain operation with its own event and invariant (next due is derived,
  not user-set), so it gets a dedicated command/method like `adjustQuantity`.
