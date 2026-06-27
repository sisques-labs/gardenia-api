# Care Schedule Context

## Purpose

The `care-schedule` context manages **recurring care plans** for plants: *"do
activity X for this plant every N days"*. Where the `care-log` context records
the care a plant *received* (the past), `care-schedule` plans the care a plant
*needs* (the future). Each schedule tracks the next due date and can be marked
complete, which advances the next due date by the interval and records the last
completion.

This is a **standalone, tenant-scoped** bounded context. It references a plant
only by raw `plantId` and imports nothing from other bounded contexts. All data
is scoped to the active `spaceId` via `SpaceContext`.

---

## Core aggregate

### `CareScheduleAggregate`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `CareScheduleIdValueObject` | UUID generated on creation |
| `plantId` | `UuidValueObject` | Plant the schedule belongs to |
| `activityType` | `CareScheduleActivityTypeValueObject` | `WATERING`, `FERTILIZING`, `PRUNING`, `REPOTTING`, `TRANSPLANTING`, `PEST_TREATMENT`, `MISTING`, `ROTATION`, `OTHER` |
| `intervalDays` | `CareScheduleIntervalDaysValueObject` | Recurrence interval in days (≥ 1) |
| `quantity` | `CareScheduleQuantityValueObject \| null` | Optional dosage (> 0) |
| `unit` | `CareScheduleUnitValueObject \| null` | `ML`, `L`, `G`, `KG` |
| `notes` | `CareScheduleNotesValueObject \| null` | Optional notes, ≤ 2000 chars |
| `nextDueAt` | `CareScheduleNextDueAtValueObject` | When the next care is due |
| `lastCompletedAt` | `CareScheduleLastCompletedAtValueObject \| null` | When care was last completed |
| `active` | `BooleanValueObject` | Whether the schedule is active (default `true`) |
| `userId` | `UuidValueObject` | User who created the schedule (`@CurrentUser`) |
| `spaceId` | `UuidValueObject` | Space owning this record (`SpaceContext` ALS) |
| `createdAt` / `updatedAt` | `DateValueObject` | Managed by TypeORM |

Domain methods:

- `create()` — applies `CareScheduleCreatedEvent`
- `update(fields)` — applies per-field `*Changed` events for each modified field
  (`activityType`, `intervalDays`, `quantity`, `unit`, `notes`, `active`) plus
  `CareScheduleUpdatedEvent`. `nextDueAt` / `lastCompletedAt` are never mutated
  here (they are in the `Omit` set).
- `complete(completedAt)` — sets `lastCompletedAt = completedAt`, recomputes
  `nextDueAt = completedAt + intervalDays` days, applies
  `CareScheduleCompletedEvent`
- `delete()` — applies `CareScheduleDeletedEvent`

Business rules enforced in the domain:
- `intervalDays` ≥ 1 (`CareScheduleIntervalDaysValueObject`, `min: 1`)
- `quantity` > 0 when present (`CareScheduleQuantityValueObject`, `min: 0.001`)
- `notes` ≤ 2000 chars
- Any space member can create, update, complete, and delete any schedule.

The aggregate is built exclusively through `CareScheduleBuilder` (extends
`BaseBuilder`); there are no static factory methods.

---

## Public API

### Commands

| Command | Purpose |
|---------|---------|
| `CreateCareScheduleCommand` | Create a care schedule for a plant |
| `UpdateCareScheduleCommand` | Update activity/interval/quantity/unit/notes/active |
| `CompleteCareScheduleCommand` | Mark complete; advances `nextDueAt` by the interval |
| `DeleteCareScheduleCommand` | Delete a care schedule |

### Queries

| Query | Purpose |
|-------|---------|
| `CareScheduleFindByIdQuery` | Get a schedule by id |
| `CareScheduleFindByCriteriaQuery` | Paginated/filtered list (`plantId`, `activityType`, `active`, `dueBefore`) |

### Events

`CareScheduleCreated`, `CareScheduleUpdated`, `CareScheduleCompleted`,
`CareScheduleDeleted`, and per-field changes: `ActivityTypeChanged`,
`IntervalDaysChanged`, `QuantityChanged`, `UnitChanged`, `NotesChanged`,
`ActiveChanged`.

---

## Transport

### REST (`/care-schedules`)

| Method | Path | Handler |
|--------|------|---------|
| POST | `/care-schedules` | Create |
| GET | `/care-schedules` | Find by criteria |
| GET | `/care-schedules/:id` | Find by id |
| PATCH | `/care-schedules/:id` | Update |
| POST | `/care-schedules/:id/complete` | Complete |
| DELETE | `/care-schedules/:id` | Delete |

All endpoints are guarded by `JwtAuthGuard` + `SpaceGuard` and require the
`X-Space-ID` header.

### GraphQL

- Queries: `careScheduleFindById`, `careSchedulesFindByCriteria`
- Mutations: `careScheduleCreate`, `careScheduleUpdate`, `careScheduleComplete`,
  `careScheduleDelete`

### MCP Tools

| Tool | Action |
|------|--------|
| `care_schedule_create` | Create a care schedule |
| `care_schedule_update` | Update a care schedule |
| `care_schedule_complete` | Complete a care schedule |
| `care_schedule_delete` | Delete a care schedule |
| `care_schedule_find_by_id` | Get a care schedule by id |
| `care_schedule_find_by_criteria` | List care schedules |

---

## Persistence

Table `care_schedules` (migration `CreateCareSchedules1780000000020`), tenant
isolated via `createTenantRepository`. Indexes on `space_id`,
`(plant_id, space_id)`, and `(space_id, active, next_due_at)` to serve the
"what's due in this space" query. FKs to `users` and `spaces`
(`ON DELETE CASCADE`); `plant_id` is indexed but has no FK, mirroring the
`care-log` context.

---

## Layering

Standard DDD + CQRS + Hexagonal: `domain / application / infrastructure /
transport`. Repository interfaces live in `domain`; the only cross-layer
dependency direction is inward. No cross-context imports (enforced by
`care-schedule-no-cross-context-import.spec.ts`).
