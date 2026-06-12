# Proposal: CareLog bounded context

## Why

Plants exist in Gardenia but nothing that happens *to* them is recorded. Users can't answer "when did I last water this?" — the single most asked question by plant owners — nor can the tasks/reminders engine (issue #156–#162) reason about schedules without knowing the last activity date. Without a care history, reminders fire blind (or not at all), streaks can't be computed, and the daily-use loop the app depends on for retention doesn't exist.

## What Changes

- New tenant-scoped **`care-log`** bounded context with a `CareLogEntryAggregate`.
- Commands: `CreateCareLogEntry`, `UpdateCareLogEntry`, `DeleteCareLogEntry`.
- Queries: `CareLogFindByPlant` (paginated, desc by `performedAt`), `CareLogFindBySpace` (paginated, filterable by `dateRange` + `activityType`), `CareLogFindLastByType` (single most-recent entry by `plantId` + `activityType`).
- Dual transport: REST + GraphQL, guarded by `JwtAuthGuard` + `SpaceGuard`.
- Domain events: `CareLogEntryCreated`, `CareLogEntryUpdated`, `CareLogEntryDeleted`.
- Cross-context: `ICareLogPort` in the `plants` context, implemented by `CareLogAdapter` via QueryBus; resolved fields `lastWateredAt` and `lastFertilizedAt` added to `PlantResponseDto`.

**Deferred to future changes:**
- Automatic stock decrement in the inventory context (issue #228).
- Push/email notifications triggered by care events.
- Streak computation and gamification.
- GraphQL subscriptions for real-time updates.

**Out of scope:**
- Care plan templates or schedules (tasks engine, #156–#162).
- Community-shared care logs.

## Capabilities

### New Capabilities

- `care-log`: tenant-scoped CRUD for care log entries, dual transport (REST + GraphQL), `findLastByType` query for cross-context consumption.

### Modified Capabilities

- `plants`: adds `lastWateredAt` and `lastFertilizedAt` as nullable resolved fields on `PlantResponseDto`, resolved via the new `ICareLogPort`.

## Impact

| Area | Impact |
|------|--------|
| `src/contexts/care-log/` | New — full bounded context (~50 files) |
| `src/contexts/plants/application/ports/care-log.port.ts` | New — `ICareLogPort` + `CARE_LOG_PORT` token |
| `src/contexts/plants/infrastructure/adapters/care-log.adapter.ts` | New — `CareLogAdapter` implementing `ICareLogPort` via QueryBus |
| `src/contexts/plants/transport/graphql/resolvers/plant/` | New resolver file for care-log resolved fields |
| `src/contexts/plants/transport/graphql/dtos/responses/plant/plant.response.dto.ts` | Modify — add `lastWateredAt?`, `lastFertilizedAt?` fields |
| `src/contexts/plants/plants.module.ts` | Modify — register `CareLogAdapter` bound to `CARE_LOG_PORT` |
| `src/app.module.ts` | Modify — register `CareLogModule` |
| `src/database/migrations/1780000000016-CreateCareLog.ts` | New — `care_log_entries` table + indexes |

## Rollback Plan

The migration `1780000000016-CreateCareLog` is additive — `down()` drops `care_log_entries`. The new fields on `PlantResponseDto` are nullable; removing the resolver leaves them `null` without breaking existing clients. The `CareLogModule` can be unregistered from `app.module.ts` independently.
