# Proposal: Care Schedule Module (`care-schedule`)

## Intent

Gardenia already records what care a plant *received* through the `care-log`
context (watering, fertilizing, pruning…). What it cannot do is tell a user what
care is *due*. There is no forward-looking plan: users must remember by heart
when to water the tomatoes again or when the monthly fertilizing falls due.

This change introduces a **tenant-scoped `care-schedule` bounded context**: a
recurring care plan attached to a plant. Each schedule says *"do activity X for
this plant every N days"*, tracks the next due date, and can be marked complete
— which advances the next due date by the interval and records the last
completion. Queries answer the planning questions: what is due (and overdue),
per plant or across the whole space.

The design mirrors the existing `inventory` and `care-log` contexts: a single
aggregate, full CQRS (commands + queries), hexagonal persistence, REST +
GraphQL + MCP transport, and strict tenant isolation. It is **fully standalone**
— it references a plant only by raw `plantId` (no import of the `plants`
context). Notifications and automatic `care-log` entry creation on completion are
explicitly deferred to future changes.

## Scope

### In Scope
- New `care-schedule` bounded context (domain → application → infrastructure → transport).
- `CareScheduleAggregate` fields: `id` (UUID), `plantId` (UUID), `activityType`
  (enum), `intervalDays` (integer ≥ 1), `quantity?` (decimal > 0), `unit?`
  (enum), `notes?` (≤ 2000 chars), `nextDueAt` (Date), `lastCompletedAt?`
  (Date), `active` (boolean, default true), `userId`, `spaceId`, `createdAt`,
  `updatedAt`.
- `CareScheduleActivityTypeEnum`: `WATERING | FERTILIZING | PRUNING | REPOTTING
  | TRANSPLANTING | PEST_TREATMENT | MISTING | ROTATION | OTHER` (mirrors
  care-log activity types).
- `CareScheduleUnitEnum`: `ML | L | G | KG` (mirrors care-log units).
- Commands: `CreateCareSchedule`, `UpdateCareSchedule`, `CompleteCareSchedule`
  (advances `nextDueAt` by `intervalDays`, sets `lastCompletedAt`),
  `DeleteCareSchedule` — any authenticated space member.
- Queries: `CareScheduleFindById`, `CareScheduleFindByCriteria` (filters:
  `plantId`, `activityType`, `active`, `dueBefore`; paginated).
- REST controller, GraphQL resolvers (code-first), and MCP tools.
- TypeORM `care_schedules` table + migration, tenant-scoped repositories.
- Domain events (created/updated/completed/deleted + per-field `*Changed`).

### Out of Scope
- Notifications / reminders delivery (push, email) — future `notifications` change.
- Automatic `care-log` entry creation on completion (cross-context port).
- Weather-aware skipping (e.g. skip watering when rain is forecast).
- Per-user ownership access control (any space member may manage any schedule).

## Impacted Bounded Contexts
- **New:** `care-schedule`.
- **Modified (wiring only):** `app.module.ts` (register module) and
  `core/filters/base-exception.filter.ts` (register exception resolver).

## Rollback Plan
The context is additive and standalone. Rollback = revert the feature commit and
run the `CreateCareSchedules` migration `down()` (drops the `care_schedules`
table and its indexes/FKs). No existing tables or contexts are altered.
