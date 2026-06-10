# Design: Generic Task Module

## Technical Approach

Two parallel structures: a **`tasks` bounded context** (DDD aggregate + CQRS) for the domain model and persistence, and a **`src/core/task-queue/`** cross-cutting module for the provider abstraction and BullMQ wiring. The two communicate through the `ITaskQueueProvider` port — `TasksModule` imports `TaskQueueModule` (global) and injects the provider to enqueue/dequeue. Domain handlers (e.g., `WaterPlantTaskHandler`) live in the bounded contexts that own those entities and register themselves against the central `TaskHandlerRegistry` at module init.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|-----------------------|-----------|
| Queue abstraction layer | `ITaskQueueProvider` port in `core/task-queue/ports/` | Context-level abstraction | Single place to swap Redis/SQS/RabbitMQ without touching domain |
| BullMQ scope | One queue `tasks-main` + DLQ `tasks-dlq` | Per-task-type queues | Simpler ops; priority + concurrency controlled at job level |
| TaskTemplate as aggregate | Full aggregate with VO fields | Plain DB record | Allows domain invariants (e.g., priority range 1–10) to be enforced in the model |
| TaskRun as TypeORM entity only | No aggregate, append-only table | Aggregate with events | Audit trail — no mutations after creation; aggregate overhead not justified |
| Handler discovery | Registry pattern (`TaskHandlerRegistry`, registered via `onModuleInit`) | NestJS metadata reflection | Explicit, testable, no magic decorators; consistent with existing handler patterns |
| Idempotency store | Redis SET with TTL (`ioredis` from BullMQ connection) | DB unique constraint | O(1) check, auto-expiry; DB constraint would require cleanup job |
| Recurrence implementation | Worker re-dispatches task on completion if `isRecurring=true` | Separate cron scheduler | Keeps scheduling logic in BullMQ; no second dependency |
| Task-user scoping | `userId` only (Phase 1) | `userId + spaceId` | Simpler; space scoping deferred to Phase 2 when use cases are clearer |
| Migration timestamps | `1780000000011`, `...0012`, `...0013` | — | `...0010` used by `planting-spots`; `...0011–0013` are next available |

## Module Structure

```
src/core/task-queue/
  config/task-queue.config.ts              # ConfigFactory: TASK_PROVIDER, TASK_REDIS_URL, TASK_IDEMPOTENCY_TTL_SECONDS
  ports/task-queue-provider.port.ts        # ITaskQueueProvider interface + TASK_QUEUE_PROVIDER token
  adapters/
    bullmq/bullmq-task-queue.adapter.ts   # BullMQ Queue + Worker wiring; DLQ handling
    sqs/sqs-task-queue-stub.adapter.ts    # Stub — throws NotImplementedException
    rabbitmq/rabbitmq-task-queue-stub.adapter.ts
  registry/task-handler.registry.ts       # Map<handlerKey, ITaskHandler>; dispatch()
  interfaces/
    task-handler.interface.ts             # ITaskHandler: { handlerKey: string; execute(payload, ctx): Promise<void> }
    task-queue-job.interface.ts           # ITaskQueueJob: { taskId, handlerKey, payload, priority, timeout }
    task-queue-context.interface.ts       # ITaskQueueContext: { reportProgress(pct): void; jobId: string }
  task-queue.module.ts                    # Global module; factory selects adapter via TASK_PROVIDER

src/contexts/tasks/
  domain/
    aggregates/
      task-template.aggregate.ts
      task.aggregate.ts
    builders/
      task-template.builder.ts
      task.builder.ts
    enums/
      task-status.enum.ts                 # PENDING | ACTIVE | COMPLETED | FAILED | CANCELLED
      task-backoff-strategy.enum.ts       # EXPONENTIAL | LINEAR | FIXED
      task-provider.enum.ts               # REDIS | SQS | RABBITMQ
    events/
      interfaces/task-event-data.interface.ts
      task-scheduled/task-scheduled.event.ts
      task-started/task-started.event.ts
      task-completed/task-completed.event.ts
      task-failed/task-failed.event.ts
      task-cancelled/task-cancelled.event.ts
      task-sent-to-dlq/task-sent-to-dlq.event.ts
    exceptions/
      task-template-not-found.exception.ts   # 404
      task-not-found.exception.ts            # 404
      task-already-cancelled.exception.ts    # 409
      task-not-cancellable.exception.ts      # 409 (active/completed/failed)
      task-duplicate-idempotency-key.exception.ts  # 409
      task-handler-not-found.exception.ts    # 500
    interfaces/
      task-template.interface.ts
      task.interface.ts
    primitives/
      task-template.primitives.ts
      task.primitives.ts
    repositories/
      read/task-template-read.repository.ts  # ITaskTemplateReadRepository + token
      read/task-read.repository.ts           # ITaskReadRepository + token
      write/task-template-write.repository.ts
      write/task-write.repository.ts
    value-objects/
      task-template-id/task-template-id.value-object.ts    # extends UuidValueObject
      task-id/task-id.value-object.ts
      task-name/task-name.value-object.ts                  # non-empty, max 255
      task-handler-key/task-handler-key.value-object.ts    # non-empty slug
      task-status/task-status.value-object.ts              # extends EnumValueObject
      task-backoff-strategy/task-backoff-strategy.value-object.ts
      task-priority/task-priority.value-object.ts          # 1–10, extends NumberValueObject
      task-concurrency/task-concurrency.value-object.ts    # 1–100
      task-retry-count/task-retry-count.value-object.ts    # 0–10
      task-timeout/task-timeout.value-object.ts            # ms, > 0
      task-cron-expression/task-cron-expression.value-object.ts  # basic cron syntax validation
    view-models/
      task-template.view-model.ts
      task.view-model.ts
  application/
    commands/
      create-task-template/create-task-template.command.ts + handler.ts
      update-task-template/update-task-template.command.ts + handler.ts
      schedule-task/schedule-task.command.ts + handler.ts
      cancel-task/cancel-task.command.ts + handler.ts
    queries/
      task-template-find-by-id/query.ts + handler.ts
      task-template-find-by-criteria/query.ts + handler.ts
      task-find-by-id/query.ts + handler.ts
      task-find-by-criteria/query.ts + handler.ts
      task-run-find-by-task/query.ts + handler.ts
    services/
      write/assert-task-template-exists/assert-task-template-exists.service.ts
      write/assert-task-exists/assert-task-exists.service.ts
      write/assert-task-cancellable/assert-task-cancellable.service.ts
      read/assert-task-template-view-model-exists/...service.ts
      read/assert-task-view-model-exists/...service.ts
  infrastructure/
    persistence/typeorm/
      entities/
        task-template.entity.ts
        task.entity.ts
        task-run.entity.ts
      mappers/
        task-template-typeorm.mapper.ts
        task-typeorm.mapper.ts
      repositories/
        task-template-typeorm-read.repository.ts
        task-template-typeorm-write.repository.ts
        task-typeorm-read.repository.ts
        task-typeorm-write.repository.ts
      task-run-typeorm.repository.ts       # Standalone (not aggregate-based)
  transport/
    rest/
      controllers/
        task-templates.controller.ts
        tasks.controller.ts
      dtos/ (request + response per resource)
      mappers/
        task-template/task-template-rest.mapper.ts
        task/task-rest.mapper.ts
    graphql/
      resolvers/
        task-template-queries.resolver.ts
        task-template-mutations.resolver.ts
        task-queries.resolver.ts
        task-mutations.resolver.ts
      dtos/ (requests + responses)
      mappers/
        task-template-graphql.mapper.ts
        task-graphql.mapper.ts
      enums/tasks-registered-enums.graphql.ts
  tasks.module.ts
```

## Data Flow

### Schedule Task (BullMQ path)

```
REST/GraphQL ──(JwtAuthGuard)──> ScheduleTaskCommand
     │
CommandBus ──> ScheduleTaskCommandHandler
     │   ├── AssertTaskTemplateExistsService (404 if unknown template)
     │   ├── IdempotencyCheck (Redis SET: key=idempotencyKey, TTL) → 409 if exists
     │   ├── TaskBuilder.build() → TaskAggregate.schedule() → TaskScheduledEvent
     │   ├── TaskTypeOrmWriteRepository.save(task)
     │   ├── ITaskQueueProvider.enqueue(ITaskQueueJob) ──> BullMQ Queue
     │   └── EventBus.publish(TaskScheduledEvent)

BullMQ Worker.process(job) ──> TaskHandlerRegistry.dispatch(handlerKey, payload, ctx)
     │   ├── Update task status → ACTIVE (TaskTypeOrmWriteRepository)
     │   ├── Create TaskRun record (start_time, status=active)
     │   ├── ITaskHandler.execute(payload, ctx)    ← domain handler (e.g. WaterPlantTaskHandler)
     │   │       ctx.reportProgress(pct) ──> update task_run.progress
     │   ├── On success:
     │   │     update task → COMPLETED; TaskRun → completed + end_time
     │   │     if isRecurring: re-enqueue with new PENDING task
     │   └── On failure (retriable):
     │         BullMQ retries per backoff config
     │         On exhaustion: move to tasks-dlq; task → FAILED; TaskRun → failed + error
```

### Cancel Task

```
REST/GraphQL ──> CancelTaskCommand
     │
CancelTaskCommandHandler
     ├── AssertTaskExistsService
     ├── AssertTaskCancellableService (status must be PENDING → else 409)
     ├── ITaskQueueProvider.cancel(jobId)   ──> BullMQ job.remove()
     ├── task.cancel() → TaskCancelledEvent
     └── TaskTypeOrmWriteRepository.save(task)
```

## Data Model

```sql
-- task_templates
CREATE TABLE task_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL UNIQUE,
  description   TEXT,
  task_title    VARCHAR(255),                    -- title inherited by generated tasks (NULL = no default)
  task_description TEXT,                         -- description inherited by generated tasks
  handler_key   VARCHAR(255),                    -- NULL = informative-only template
  default_priority    SMALLINT NOT NULL DEFAULT 5,   -- 1–10
  default_retry_count SMALLINT NOT NULL DEFAULT 3,
  default_backoff_strategy VARCHAR(20) NOT NULL DEFAULT 'exponential',
  default_timeout_ms  INTEGER NOT NULL DEFAULT 30000,
  max_concurrency     SMALLINT NOT NULL DEFAULT 5,
  user_id       UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tasks
CREATE TABLE tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_id UUID REFERENCES task_templates(id),  -- NULL = ad-hoc task
  trigger_type     VARCHAR(20) NOT NULL DEFAULT 'scheduled',  -- 'scheduled' | 'user'
  title            VARCHAR(255),                         -- NULL for scheduled tasks without explicit title
  description      TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  payload          JSONB NOT NULL DEFAULT '{}',
  priority         SMALLINT NOT NULL DEFAULT 5,
  delay_ms         INTEGER,                       -- NULL = immediate
  cron_expression  VARCHAR(100),                  -- NULL = one-shot
  is_recurring     BOOLEAN NOT NULL DEFAULT false,
  max_runs         INTEGER,                       -- NULL = infinite (only when is_recurring)
  run_count        INTEGER NOT NULL DEFAULT 0,
  idempotency_key  VARCHAR(255),
  queue_job_id     VARCHAR(255),                  -- BullMQ job ID for cancellation
  user_id          UUID NOT NULL,
  target_type      VARCHAR(100),
  target_id        UUID,
  valid_from       TIMESTAMPTZ,
  valid_until      TIMESTAMPTZ,
  scheduled_at     TIMESTAMPTZ,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  failed_at        TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IDX_tasks_status ON tasks(status);
CREATE INDEX IDX_tasks_user_id ON tasks(user_id);
CREATE INDEX IDX_tasks_trigger_type ON tasks(trigger_type);
CREATE UNIQUE INDEX UQ_tasks_idempotency_key ON tasks(idempotency_key) WHERE idempotency_key IS NOT NULL AND status NOT IN ('completed','failed','cancelled');

-- task_runs
CREATE TABLE task_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id),
  attempt     SMALLINT NOT NULL DEFAULT 1,
  status      VARCHAR(20) NOT NULL,             -- active | completed | failed
  progress    SMALLINT NOT NULL DEFAULT 0,      -- 0–100
  error       TEXT,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IDX_task_runs_task_id ON task_runs(task_id);
```

## Interfaces / Contracts

```ts
// core/task-queue/interfaces/task-handler.interface.ts
export const TASK_QUEUE_PROVIDER = Symbol('TASK_QUEUE_PROVIDER');

export interface ITaskHandler {
  readonly handlerKey: string;
  execute(payload: Record<string, unknown>, ctx: ITaskQueueContext): Promise<void>;
}

export interface ITaskQueueContext {
  jobId: string;
  reportProgress(percent: number): Promise<void>;
}

// core/task-queue/ports/task-queue-provider.port.ts
export interface ITaskQueueJob {
  taskId: string;
  handlerKey: string;
  payload: Record<string, unknown>;
  priority: number;          // 1–10
  timeoutMs: number;
  delayMs?: number;
  cronExpression?: string;
  attempt?: number;
}

export interface ITaskQueueProvider {
  enqueue(job: ITaskQueueJob): Promise<string>;     // returns queue job ID
  cancel(queueJobId: string): Promise<void>;
  onModuleInit(): Promise<void>;
  onModuleDestroy(): Promise<void>;
}
```

## BullMQ Config

```ts
// BullMQ job options derived from ITaskQueueJob
const opts: JobsOptions = {
  priority: 11 - job.priority,   // BullMQ: lower number = higher priority; invert 1–10 scale
  delay: job.delayMs,
  repeat: job.cronExpression ? { pattern: job.cronExpression } : undefined,
  attempts: template.defaultRetryCount + 1,
  backoff: {
    type: template.defaultBackoffStrategy,  // 'exponential' | 'fixed'
    delay: 1000,
  },
  removeOnComplete: { count: 1000 },
  removeOnFail: false,           // keep for DLQ inspection
};
```

## Example Domain Handler (Gardenia)

```ts
// src/contexts/plants/application/task-handlers/water-plant.task-handler.ts
@Injectable()
export class WaterPlantTaskHandler implements ITaskHandler, OnModuleInit {
  readonly handlerKey = 'water-plant';

  constructor(
    private readonly registry: TaskHandlerRegistry,
    private readonly queryBus: QueryBus,
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  async execute(payload: { plantId: string }, ctx: ITaskQueueContext): Promise<void> {
    await ctx.reportProgress(10);
    const plant = await this.queryBus.execute(new PlantFindByIdQuery({ id: payload.plantId }));
    // ... perform watering logic
    await ctx.reportProgress(100);
  }
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Aggregate state machine (status transitions, events), VO validations (priority 1–10, cron format), assert services, handler registry dispatch | Jest, `jest.Mocked<T>` |
| Unit | `ScheduleTaskHandler` — idempotency check, template lookup, enqueue call | Mock `ITaskQueueProvider` via token |
| Unit | `CancelTaskHandler` — non-pending throws 409 | Mock provider |
| Integration | TypeORM repositories: save + find task; `task_runs` append; idempotency index | Real Postgres (Testcontainers) |
| E2E | REST + GraphQL CRUD for templates; schedule + cancel task; status polling | Supertest; mock BullMQ worker |

## Migration / Rollout

Three additive migrations, no existing data touched:
- `1780000000011-CreateTaskTemplates`
- `1780000000012-CreateTasks`
- `1780000000013-CreateTaskRuns`

`down()` drops tables in reverse order (task_runs → tasks → task_templates). BullMQ queues created lazily on first `enqueue()` call — no pre-flight setup needed.

## Open Questions

- [ ] Should task templates be space-scoped or global (user-scoped only)? Phase 1 assumes user-scoped; revisit before Phase 2.
- [ ] Should the BullMQ worker run in the same NestJS process or a separate worker process? Phase 1: same process for simplicity; Phase 2 can extract it.
