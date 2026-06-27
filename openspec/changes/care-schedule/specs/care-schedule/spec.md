# Care Schedule — Tenant-scoped recurring plant care plans

**Source change:** care-schedule
**Created:** 2026-06-27

---

## Requirements

### Requirement: CareScheduleAggregate Fields and Validation

The `CareScheduleAggregate` MUST carry: `id` (UUID, generated), `plantId` (UUID),
`activityType` (`CareScheduleActivityTypeEnum`), `intervalDays` (integer ≥ 1),
`quantity` (optional decimal > 0), `unit` (optional `CareScheduleUnitEnum`),
`notes` (optional string, max 2000 chars), `nextDueAt` (Date), `lastCompletedAt`
(optional Date), `active` (boolean, default true), `userId` (UUID, the creator),
`spaceId` (UUID, tenant scope), `createdAt`, `updatedAt`.

The system MUST reject `intervalDays < 1`.
The system MUST reject `quantity <= 0` when provided.
The system MUST reject `notes` longer than 2000 chars.

#### Scenario: Valid care schedule aggregate

- GIVEN plantId, activityType=WATERING, intervalDays=3, nextDueAt set, active=true
- WHEN a `CareScheduleAggregate` is built
- THEN all fields are set and the aggregate is valid

#### Scenario: Interval below one rejected

- GIVEN intervalDays=0
- WHEN a `CareScheduleAggregate` is built
- THEN a domain validation error is thrown

#### Scenario: Non-positive quantity rejected

- GIVEN quantity=0
- WHEN a `CareScheduleAggregate` is built
- THEN a domain validation error is thrown

#### Scenario: Optional fields omitted

- GIVEN no quantity, unit, notes, or lastCompletedAt
- WHEN a `CareScheduleAggregate` is built
- THEN those fields are null and the aggregate is valid

---

### Requirement: CareScheduleActivityTypeEnum

The system MUST support exactly: `WATERING`, `FERTILIZING`, `PRUNING`,
`REPOTTING`, `TRANSPLANTING`, `PEST_TREATMENT`, `MISTING`, `ROTATION`, `OTHER`.
Any value outside the set MUST be rejected at the VO level.

#### Scenario: Valid activity type accepted

- GIVEN activity type value `"FERTILIZING"`
- WHEN `CareScheduleActivityTypeValueObject` is constructed
- THEN no error is thrown

#### Scenario: Unknown activity type rejected

- GIVEN activity type value `"DANCING"`
- WHEN `CareScheduleActivityTypeValueObject` is constructed
- THEN a domain validation error is thrown

---

### Requirement: CareScheduleUnitEnum

The system MUST support exactly: `ML`, `L`, `G`, `KG`. Any value outside this set
MUST be rejected at the VO level.

#### Scenario: Valid unit accepted

- GIVEN unit value `"ML"`
- WHEN `CareScheduleUnitValueObject` is constructed
- THEN no error is thrown

#### Scenario: Invalid unit rejected

- GIVEN unit value `"CUPS"`
- WHEN `CareScheduleUnitValueObject` is constructed
- THEN a domain validation error is thrown

---

### Requirement: CreateCareSchedule Command

Any authenticated space member MAY create a care schedule.

The command MUST accept `plantId`, `activityType`, `intervalDays`, and optional
`quantity`, `unit`, `notes`, `nextDueAt` (the first due date, defaulting to now),
and `active` (default true). `userId` MUST come from `@CurrentUser`. `spaceId`
MUST come from `SpaceContext` ALS — never from the request payload.

On success the handler MUST emit `CareScheduleCreated`, persist the aggregate,
and return `careScheduleId`.

#### Scenario: Happy path

- GIVEN an authenticated user who is a member of the active space
- WHEN `CreateCareSchedule` is dispatched with valid fields
- THEN a `CareScheduleAggregate` is persisted, `CareScheduleCreated` is emitted, and `careScheduleId` is returned

#### Scenario: Invalid interval rejected

- GIVEN intervalDays=0
- WHEN `CreateCareSchedule` is dispatched
- THEN a 400 Bad Request is returned and no aggregate is persisted

---

### Requirement: UpdateCareSchedule Command

Any authenticated space member MAY update any care schedule in the space.

The command MUST accept optional `activityType`, `intervalDays`, `quantity`,
`unit`, `notes`, `active`. A no-op update MUST still succeed. `nextDueAt` and
`lastCompletedAt` MUST NOT be mutated by this command (use `CompleteCareSchedule`).

The handler MUST load the schedule from the tenant-scoped repository; if not
found, throw `CareScheduleNotFoundException` (404). On success it MUST emit
`CareScheduleUpdated` plus a per-field change event only for each field whose
value actually changed.

#### Scenario: Member updates a schedule

- GIVEN an authenticated member of the space
- WHEN `UpdateCareSchedule` is dispatched changing `intervalDays`
- THEN the schedule is updated, `IntervalDaysChanged` and `CareScheduleUpdated` are emitted

#### Scenario: Deactivating a schedule

- GIVEN an active schedule
- WHEN `UpdateCareSchedule` is dispatched with `active=false`
- THEN `active` becomes false and `ActiveChanged` is emitted

#### Scenario: Schedule not found

- GIVEN a careScheduleId that does not exist in the active space
- WHEN `UpdateCareSchedule` is dispatched
- THEN `CareScheduleNotFoundException` is thrown and 404 is returned

---

### Requirement: CompleteCareSchedule Command

Any authenticated space member MAY mark a care schedule complete.

The command MUST accept `careScheduleId` and an optional `completedAt` (defaulting
to now). On completion the aggregate MUST set `lastCompletedAt = completedAt` and
recompute `nextDueAt = completedAt + intervalDays` whole days, then emit
`CareScheduleCompleted` carrying `{ id, completedAt, nextDueAt }`.

The handler MUST load the schedule via the tenant-scoped repository; if not
found, throw `CareScheduleNotFoundException` (404).

#### Scenario: Completing advances the next due date

- GIVEN a schedule with intervalDays=3 completed at 2026-06-27
- WHEN `CompleteCareSchedule` is dispatched
- THEN `lastCompletedAt` becomes 2026-06-27, `nextDueAt` becomes 2026-06-30, and `CareScheduleCompleted` is emitted

#### Scenario: Schedule not found

- GIVEN a careScheduleId that does not exist in the active space
- WHEN `CompleteCareSchedule` is dispatched
- THEN `CareScheduleNotFoundException` is thrown and 404 is returned

---

### Requirement: DeleteCareSchedule Command

Any authenticated space member MAY delete any care schedule in the space. The
handler MUST emit `CareScheduleDeleted` before deleting from persistence.

#### Scenario: Member deletes a schedule

- GIVEN an authenticated member of the space
- WHEN `DeleteCareSchedule` is dispatched
- THEN the schedule is deleted and `CareScheduleDeleted` is emitted

#### Scenario: Schedule not found

- GIVEN a careScheduleId that does not exist in the active space
- WHEN `DeleteCareSchedule` is dispatched
- THEN `CareScheduleNotFoundException` is thrown and 404 is returned

---

### Requirement: CareScheduleFindById Query

Returns a single `CareScheduleViewModel` for the given id, scoped to the active
space.

#### Scenario: Found in space

- GIVEN a careScheduleId that exists in the active space
- WHEN `CareScheduleFindById` is dispatched
- THEN a `CareScheduleViewModel` is returned with all fields

#### Scenario: Not found or wrong space

- GIVEN a careScheduleId that does not exist in the active space
- WHEN `CareScheduleFindById` is dispatched
- THEN `CareScheduleNotFoundException` is thrown and 404 is returned

---

### Requirement: CareScheduleFindByCriteria Query

Returns a paginated list of `CareScheduleViewModel` for the active space.

Supported filters (all optional):
- `plantId`: exact match
- `activityType`: exact match on `CareScheduleActivityTypeEnum` value
- `active`: exact boolean match
- `dueBefore`: returns only schedules where `nextDueAt <= value` (due/overdue)

Default pagination: `page=1`, `limit=20`. An empty result MUST return 200 with an
empty list, not 404.

#### Scenario: Returns schedules for active space only

- GIVEN schedules in Space A and Space B
- WHEN `CareScheduleFindByCriteria` is dispatched under Space A context
- THEN only Space A schedules are returned

#### Scenario: due-before filter

- GIVEN schedule X (nextDueAt=2026-06-28) and schedule Y (nextDueAt=2026-07-15)
- WHEN criteria `dueBefore=2026-06-30` is applied
- THEN only schedule X is returned

#### Scenario: plantId filter

- GIVEN schedules for plant P and plant Q
- WHEN criteria `plantId=P` is applied
- THEN only plant P schedules are returned

---

### Requirement: REST Transport

The system MUST expose the following endpoints, all guarded by `JwtAuthGuard` and
`SpaceGuard`:

| Method | Path | Handler | Success Code |
|--------|------|---------|--------------|
| POST | /care-schedules | CreateCareSchedule | 201 |
| GET | /care-schedules | CareScheduleFindByCriteria | 200 |
| GET | /care-schedules/:id | CareScheduleFindById | 200 |
| PATCH | /care-schedules/:id | UpdateCareSchedule | 200 |
| POST | /care-schedules/:id/complete | CompleteCareSchedule | 200 |
| DELETE | /care-schedules/:id | DeleteCareSchedule | 200 |

All endpoints MUST require the `X-Space-ID` header. `@CurrentUser` supplies
`userId`. Response bodies MUST use `CareScheduleRestResponseDto` mapped from
`CareScheduleViewModel`.

---

### Requirement: GraphQL Transport

The system MUST expose GraphQL operations guarded by `JwtAuthGuard` and
`SpaceGuard`:

**Queries**: `careScheduleFindById(input): CareScheduleResponseDto`,
`careSchedulesFindByCriteria(input): PaginatedCareSchedulesResultDto`

**Mutations**: `careScheduleCreate`, `careScheduleUpdate`, `careScheduleComplete`,
`careScheduleDelete` — each returning `MutationResponseDto`.

`CareScheduleActivityTypeEnum` and `CareScheduleUnitEnum` MUST be registered with
`registerEnumType`. Schema MUST be generated via `autoSchemaFile` (code-first).
Both resolvers MUST dispatch exclusively via `CommandBus`/`QueryBus`.

---

### Requirement: MCP Transport

The context MUST expose its public commands and queries as MCP tools under
`transport/mcp/`: `care_schedule_create`, `care_schedule_update`,
`care_schedule_complete`, `care_schedule_delete`, `care_schedule_find_by_id`,
`care_schedule_find_by_criteria`. Each tool dispatches through the
Command/Query bus and reads `userId`/`spaceId` from the MCP tool context.

---

### Requirement: Tenant Isolation

All care-schedule reads and writes MUST be scoped to the active `spaceId` via
`createTenantRepository`. A schedule created under Space A MUST NOT be visible
under Space B.

#### Scenario: Cross-tenant invisibility

- GIVEN a schedule created under Space A
- WHEN `CareScheduleFindById` is dispatched under Space B context with the same id
- THEN `CareScheduleNotFoundException` is thrown

---

### Requirement: No Cross-Context Coupling

The `care-schedule` bounded context MUST NOT import from `@contexts/plants/`,
`@contexts/plant-species/`, `@contexts/care-log/`, `@contexts/inventory/`, or any
other bounded context. A plant is referenced only by raw `plantId`.

#### Scenario: No forbidden imports

- GIVEN the source tree under `src/contexts/care-schedule/`
- WHEN scanned for imports
- THEN no import path matches another bounded context
