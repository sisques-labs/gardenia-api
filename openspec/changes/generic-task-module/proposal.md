# Proposal: Generic Task Module (`tasks`)

## Intent

Gardenia has no way to schedule or track recurring garden work. Actions like watering a plant, pruning tomatoes, harvesting the plum tree, preparing winter crops, or planting seedlings happen outside the app — untracked, unscheduled, and unreliable.

This change introduces a **generic, queue-backed task module** that lets the domain schedule, execute, and audit any unit of work. Tasks are backed by **BullMQ (Redis)** with the queue provider selectable via `TASK_PROVIDER` in `.env`, so the same domain code runs on SQS or RabbitMQ without changes.

Why now: the `planting-spots` and `plants` contexts are stable, giving the task module real entities to target. A generic design means future bounded contexts (harvest tracking, notifications, sensor reads) plug in as new task types without touching the module core.

## Scope

### In Scope
- New `tasks` bounded context (`domain → application → infrastructure → transport`), following existing DDD + CQRS + Hexagonal patterns.
- New `src/core/task-queue/` cross-cutting infrastructure: provider abstraction (`ITaskQueueProvider`), BullMQ adapter, SQS stub adapter, RabbitMQ stub adapter, config factory (`task-queue.config.ts`), `TaskQueueModule` (global).
- **TaskTemplate aggregate**: named recipe for a task type — default retry count, backoff strategy, timeout, priority, max concurrency, handler key.
- **Task aggregate**: single schedulable unit of work — payload, schedule (immediate / delayed / cron), recurrence, idempotency key, priority override, current status.
- **TaskRun entity** (TypeORM, no aggregate): immutable audit record of one execution attempt — start time, end time, status, progress snapshots, error.
- Task lifecycle: `pending → active → completed | failed | cancelled`; failed tasks retry per template config; exhausted tasks move to Dead Letter Queue.
- Scheduling modes: immediate dispatch, delayed by duration, cron expression (with recurrence flag to re-enqueue on completion).
- Cancellation: cancel a `pending` task before it is picked up.
- Progress reporting: worker can emit 0–100% progress; stored on the active TaskRun.
- Priorities: 1–10 (1 = highest), passed to BullMQ job options.
- Idempotency: optional `idempotencyKey` prevents duplicate enqueue within a configurable TTL window.
- Commands: `CreateTaskTemplate`, `UpdateTaskTemplate`, `ScheduleTask`, `CancelTask`.
- Queries: `TaskTemplateFindById`, `TaskTemplateFindByCriteria`, `TaskFindById`, `TaskFindByCriteria`, `TaskRunFindByTask`.
- TypeORM entities + migrations for `task_templates`, `tasks`, `task_runs`.
- Transport: REST + GraphQL (mirrors pattern from `planting-spots`).
- Register `TasksModule` and `TaskQueueModule` in `src/app.module.ts`.
- Add `TASK_PROVIDER`, `TASK_REDIS_URL`, `TASK_IDEMPOTENCY_TTL_SECONDS` to `.env.example`.

### Out of Scope (deferred)
- Real SQS and RabbitMQ adapters (stubs only; interface wiring complete).
- Task chaining / workflows.
- Batch tasks.
- Rate limiting per task type.
- Distributed locking.
- Bull Board / dashboard UI.
- Tenant (space) scoping of tasks — tasks are user-scoped only in Phase 1; space scoping is Phase 2.
- Push notifications on task events.

## Capabilities

### New Capabilities
- `task-templates`: Define reusable task blueprints with retry/timeout/priority/concurrency defaults.
- `tasks`: Schedule, track, cancel, and audit any unit of work against a template.
- `task-queue`: Provider-agnostic queue infrastructure (BullMQ by default, SQS/RabbitMQ stubs).

### Modified Capabilities
- `AppModule`: registers `TaskQueueModule` (global) and `TasksModule`.
- `.env.example`: adds three new variables.

## Approach

- **Provider abstraction**: `ITaskQueueProvider` port in `src/core/task-queue/ports/`. BullMQ adapter wraps a single BullMQ `Queue` + `Worker`. Stub adapters for SQS and RabbitMQ satisfy the interface with no-ops. Factory in `TaskQueueModule` reads `TASK_PROVIDER` and injects the correct adapter via `TASK_QUEUE_PROVIDER` token.
- **Handler registry**: a `TaskHandlerRegistry` service maps `handlerKey → ITaskHandler`. Domain handlers (e.g., `WaterPlantTaskHandler`) register themselves on module init. Workers call the registry to dispatch execution. This keeps the core module generic — it knows nothing about gardening.
- **BullMQ worker**: one `Worker` per queue; `concurrency` read from the template at dispatch time (passed as BullMQ job option). DLQ implemented as a separate BullMQ queue (`tasks-dlq`).
- **TypeORM persistence**: `tasks` and `task_templates` tables persist the full aggregate state. `task_runs` is append-only (no update). `status` column on `tasks` is the single source of truth for the lifecycle.
- **Recurrence**: after a cron/recurring task completes successfully, the worker re-dispatches the same task with a fresh `pending` status and incremented `runCount`. A `maxRuns` field (`null` = infinite) gates termination.
- **Idempotency**: on `ScheduleTask`, if an active task with the same `idempotencyKey` exists in the Redis SET (TTL = `TASK_IDEMPOTENCY_TTL_SECONDS`, default 3600), the command is a no-op and returns the existing task ID.
- **No cross-context DB queries**: `WaterPlantTaskHandler` receives the `plantId` in the task payload and calls `QueryBus` to read it — no direct repo injection.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/core/task-queue/` | New | Cross-cutting queue infrastructure |
| `src/contexts/tasks/` | New | Full bounded context |
| `src/database/migrations/` | New (×3) | `task_templates`, `tasks`, `task_runs` tables |
| `src/app.module.ts` | Modified | Register `TaskQueueModule` + `TasksModule` |
| `.env.example` | Modified | Add `TASK_PROVIDER`, `TASK_REDIS_URL`, `TASK_IDEMPOTENCY_TTL_SECONDS` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| BullMQ Redis connection unavailable in tests | High | Mock `ITaskQueueProvider` in unit/integration tests; E2E uses `docker-compose.test.yml` Redis service |
| Duplicate migration timestamps | Low | Assign `1780000000011–0013`; verify against existing max |
| Handler registry missing key at runtime | Med | `TaskHandlerRegistry` throws on dispatch if key unknown; validated in worker before dequeuing |
| Recurrence loop producing runaway tasks | Low | `maxRuns` cap; `isRecurring=false` by default |
| Idempotency TTL misconfigured (0) | Low | Config factory validates > 0, defaults to 3600 |

## Rollback Plan

Revert branch; run `down()` on migrations `0013 → 0011` (drop `task_runs`, `tasks`, `task_templates`). Remove `TaskQueueModule` + `TasksModule` from `app.module.ts`. Stop BullMQ worker (NestJS lifecycle hook handles this). No other contexts reference `tasks` in Phase 1 — rollback is clean.

## Dependencies

- `bullmq` npm package (new dependency).
- Existing: `@sisques-labs/nestjs-kit`, `@nestjs/cqrs`, TypeORM, NestJS lifecycle hooks.
- No other bounded context imports `tasks` in Phase 1 — unidirectional dependency.

## Success Criteria

- [ ] Task templates CRUD via REST and GraphQL.
- [ ] `ScheduleTask` enqueues a BullMQ job; worker picks it up and calls the registered handler.
- [ ] Delayed and cron tasks fire at the correct time (integration-tested with short intervals).
- [ ] Recurring task re-enqueues itself after completion until `maxRuns` reached.
- [ ] Failed task retries N times then moves to DLQ; `task_runs` records each attempt.
- [ ] Cancellation of a `pending` task removes it from the queue and marks it `cancelled`.
- [ ] Idempotency key prevents duplicate enqueue within TTL.
- [ ] `TASK_PROVIDER=redis` (default) works; switching to `sqs` or `rabbitmq` stubs does not crash on boot.
- [ ] Unit, integration, and E2E tests green.
