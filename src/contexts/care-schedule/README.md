# Care Schedule Context

## Purpose

The `care-schedule` context manages **care plans** for plants. A schedule can be
**recurring** (*"do activity X for this plant every N days"*, with `intervalDays`
set) or **one-time** for a specific day (*"do activity X on this date"*, with
`intervalDays` omitted / `null`). Where the `care-log` context records the care a
plant *received* (the past), `care-schedule` plans the care a plant *needs* (the
future). Each schedule tracks the next due date and can be marked complete:
recurring schedules advance the next due date by the interval, while one-time
schedules are deactivated. Both record the last completion.

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
| `intervalDays` | `CareScheduleIntervalDaysValueObject \| null` | Recurrence interval in days (≥ 1); `null` for a one-time schedule |
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
- `complete(completedAt)` — sets `lastCompletedAt = completedAt`. For a recurring
  schedule, recomputes `nextDueAt = completedAt + intervalDays` days. For a
  one-time schedule (`intervalDays === null`), keeps `nextDueAt` and deactivates
  the schedule (`active = false`). Applies `CareScheduleCompletedEvent`
- `delete()` — applies `CareScheduleDeletedEvent`

Business rules enforced in the domain:
- `intervalDays` ≥ 1 when present (`CareScheduleIntervalDaysValueObject`, `min: 1`); `null` marks a one-time schedule
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
| `CompleteCareScheduleCommand` | Mark complete; advances `nextDueAt` and mirrors the activity into `care-log` |
| `DeleteCareScheduleCommand` | Delete a care schedule |
| `WaterPlantCommand` | Water a single plant: completes its active `WATERING` schedule if one exists, otherwise records an ad-hoc `care-log` entry (hybrid mechanism) |

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
| POST | `/care-schedules/water-plant` | Water a single plant (hybrid mechanism) |
| DELETE | `/care-schedules/:id` | Delete |

All endpoints are guarded by `JwtAuthGuard` + `SpaceGuard` and require the
`X-Space-ID` header.

### GraphQL

- Queries: `careScheduleFindById`, `careSchedulesFindByCriteria`
- Mutations: `careScheduleCreate`, `careScheduleUpdate`, `careScheduleComplete`,
  `careScheduleWaterPlant`, `careScheduleDelete`

### MCP Tools

| Tool | Action |
|------|--------|
| `care_schedule_create` | Create a care schedule |
| `care_schedule_update` | Update a care schedule |
| `care_schedule_complete` | Complete a care schedule |
| `care_schedule_water_plant` | Water a single plant (hybrid mechanism) |
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

## Cross-context bridge: care-log

Completing a schedule is a performed care activity, so it is mirrored into the
`care-log` context. This is the context's only outward dependency and lives
entirely behind a port:

- `ICareLogPort` (`application/ports/care-log.port.ts`)
- `CareLogAdapter` (`infrastructure/adapters/care-log.adapter.ts`) — dispatches
  `CreateCareLogEntryCommand` on the Command bus.

`CompleteCareScheduleCommandHandler` depends on the port (`CARE_LOG_PORT`),
never on `care-log` directly. The bridge is **best-effort**: the schedule
completion is authoritative and a care-log failure is logged but does not roll
it back.

## Layering

Standard DDD + CQRS + Hexagonal: `domain / application / infrastructure /
transport`. Repository interfaces live in `domain`; the only cross-layer
dependency direction is inward. The only cross-context dependency is the
care-log bridge, confined to `infrastructure/adapters/` (enforced by
`care-schedule-no-cross-context-import.spec.ts`, which excludes the adapters
directory).
