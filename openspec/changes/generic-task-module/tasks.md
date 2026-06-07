# Tasks: Generic Task Module

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2 000 – 2 800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → Core task-queue infrastructure · PR 2 → Domain + Application · PR 3 → Infrastructure + Migrations · PR 4 → Transport + Module wiring · PR 5 → Tests |
| Delivery strategy | phased |

### Suggested Work Units

| Unit | Goal | Likely PR |
|------|------|-----------|
| 1 | `src/core/task-queue/` — provider port, BullMQ adapter, stub adapters, registry, config, module | PR 1 |
| 2 | `src/contexts/tasks/domain/` + `application/` — aggregates, VOs, events, exceptions, commands, queries, services | PR 2 |
| 3 | `src/contexts/tasks/infrastructure/` — TypeORM entities, mappers, repos + 3 migrations | PR 3 |
| 4 | `src/contexts/tasks/transport/` — REST + GraphQL + module wiring + app.module.ts + .env.example | PR 4 |
| 5 | Tests — unit, integration, E2E | PR 5 |

---

## Phase 0: Dependencies

- [ ] 0.1 Add `bullmq` to `package.json`: `pnpm add bullmq`
- [ ] 0.2 Confirm `ioredis` is available (BullMQ peer dep); add if missing: `pnpm add ioredis`

---

## Phase 1: Core task-queue infrastructure

- [ ] 1.1 Create `src/core/task-queue/interfaces/task-handler.interface.ts` — `ITaskHandler { handlerKey: string; execute(payload, ctx): Promise<void> }` + `ITaskQueueContext { jobId: string; reportProgress(pct: number): Promise<void> }`
- [ ] 1.2 Create `src/core/task-queue/interfaces/task-queue-job.interface.ts` — `ITaskQueueJob { taskId, handlerKey, payload, priority, timeoutMs, delayMs?, cronExpression? }`
- [ ] 1.3 Create `src/core/task-queue/ports/task-queue-provider.port.ts` — `ITaskQueueProvider { enqueue(job): Promise<string>; cancel(queueJobId): Promise<void>; onModuleInit(): Promise<void>; onModuleDestroy(): Promise<void> }` + `TASK_QUEUE_PROVIDER` symbol
- [ ] 1.4 Create `src/core/task-queue/registry/task-handler.registry.ts` — `@Injectable() TaskHandlerRegistry`; `register(handler: ITaskHandler): void`; `dispatch(handlerKey, payload, ctx): Promise<void>`; throws `TaskHandlerNotFoundException` if key not found
- [ ] 1.5 Create `src/core/task-queue/adapters/bullmq/bullmq-task-queue.adapter.ts` — implements `ITaskQueueProvider`; creates BullMQ `Queue('tasks-main')` and `Queue('tasks-dlq')`; `Worker` in `onModuleInit()`; worker calls `TaskHandlerRegistry.dispatch()`; updates task status to ACTIVE on pickup, COMPLETED/FAILED on finish; moves to DLQ on exhaustion; `onModuleDestroy()` closes worker + queues
- [ ] 1.6 Create `src/core/task-queue/adapters/sqs/sqs-task-queue-stub.adapter.ts` — implements `ITaskQueueProvider`; all methods throw `NotImplementedException('SQS provider not yet implemented')`
- [ ] 1.7 Create `src/core/task-queue/adapters/rabbitmq/rabbitmq-task-queue-stub.adapter.ts` — same pattern as SQS stub
- [ ] 1.8 Create `src/core/task-queue/config/task-queue.config.ts` — `ConfigFactory`; reads `TASK_PROVIDER` (default `'redis'`), `TASK_REDIS_URL` (default `'redis://localhost:6379'`), `TASK_IDEMPOTENCY_TTL_SECONDS` (default `3600`, must be > 0)
- [ ] 1.9 Create `src/core/task-queue/task-queue.module.ts` — `@Global() @Module`; `ConfigModule.forFeature(taskQueueConfig)`; factory provider for `TASK_QUEUE_PROVIDER` reading `TASK_PROVIDER` env and selecting adapter; exports `TASK_QUEUE_PROVIDER` + `TaskHandlerRegistry`

---

## Phase 2: Domain layer

- [ ] 2.1 Create `src/contexts/tasks/domain/enums/task-status.enum.ts` — `PENDING | ACTIVE | COMPLETED | FAILED | CANCELLED`
- [ ] 2.2 Create `src/contexts/tasks/domain/enums/task-backoff-strategy.enum.ts` — `EXPONENTIAL | LINEAR | FIXED`
- [ ] 2.3 Create `src/contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object.ts` — extends `UuidValueObject`
- [ ] 2.4 Create `src/contexts/tasks/domain/value-objects/task-id/task-id.value-object.ts` — extends `UuidValueObject`
- [ ] 2.5 Create `src/contexts/tasks/domain/value-objects/task-name/task-name.value-object.ts` — extends `StringValueObject`; non-empty, max 255
- [ ] 2.6 Create `src/contexts/tasks/domain/value-objects/task-handler-key/task-handler-key.value-object.ts` — extends `StringValueObject`; non-empty, slug format (lowercase + hyphens)
- [ ] 2.7 Create `src/contexts/tasks/domain/value-objects/task-status/task-status.value-object.ts` — extends `EnumValueObject<typeof TaskStatusEnum>`
- [ ] 2.8 Create `src/contexts/tasks/domain/value-objects/task-backoff-strategy/task-backoff-strategy.value-object.ts` — extends `EnumValueObject<typeof TaskBackoffStrategyEnum>`
- [ ] 2.9 Create `src/contexts/tasks/domain/value-objects/task-priority/task-priority.value-object.ts` — extends `NumberValueObject`; validates 1–10
- [ ] 2.10 Create `src/contexts/tasks/domain/value-objects/task-concurrency/task-concurrency.value-object.ts` — extends `NumberValueObject`; validates 1–100
- [ ] 2.11 Create `src/contexts/tasks/domain/value-objects/task-retry-count/task-retry-count.value-object.ts` — extends `NumberValueObject`; validates 0–10
- [ ] 2.12 Create `src/contexts/tasks/domain/value-objects/task-timeout/task-timeout.value-object.ts` — extends `NumberValueObject`; validates > 0 (ms)
- [ ] 2.13 Create `src/contexts/tasks/domain/value-objects/task-cron-expression/task-cron-expression.value-object.ts` — extends `StringValueObject`; basic 5-field cron validation (regex)
- [ ] 2.14 Create `src/contexts/tasks/domain/events/interfaces/task-event-data.interface.ts`
- [ ] 2.15 Create domain events (one file each):
  - `task-scheduled/task-scheduled.event.ts`
  - `task-started/task-started.event.ts`
  - `task-completed/task-completed.event.ts`
  - `task-failed/task-failed.event.ts`
  - `task-cancelled/task-cancelled.event.ts`
  - `task-sent-to-dlq/task-sent-to-dlq.event.ts`
- [ ] 2.16 Create `src/contexts/tasks/domain/exceptions/task-template-not-found.exception.ts` — HTTP 404
- [ ] 2.17 Create `src/contexts/tasks/domain/exceptions/task-not-found.exception.ts` — HTTP 404
- [ ] 2.18 Create `src/contexts/tasks/domain/exceptions/task-not-cancellable.exception.ts` — HTTP 409; message includes current status
- [ ] 2.19 Create `src/contexts/tasks/domain/exceptions/task-duplicate-idempotency-key.exception.ts` — HTTP 409
- [ ] 2.20 Create `src/contexts/tasks/domain/exceptions/task-handler-not-found.exception.ts` — HTTP 500; thrown by registry
- [ ] 2.21 Create `src/contexts/tasks/domain/interfaces/task-template.interface.ts` — all fields as value objects
- [ ] 2.22 Create `src/contexts/tasks/domain/interfaces/task.interface.ts` — all fields as value objects
- [ ] 2.23 Create `src/contexts/tasks/domain/primitives/task-template.primitives.ts` — extends `BasePrimitives`
- [ ] 2.24 Create `src/contexts/tasks/domain/primitives/task.primitives.ts` — extends `BasePrimitives`; includes `queueJobId?: string`
- [ ] 2.25 Create `src/contexts/tasks/domain/view-models/task-template.view-model.ts` — extends `BaseViewModel`
- [ ] 2.26 Create `src/contexts/tasks/domain/view-models/task.view-model.ts` — extends `BaseViewModel`; includes `runCount`, `scheduledAt`, `completedAt`, `failedAt`, `cancelledAt`
- [ ] 2.27 Create `src/contexts/tasks/domain/repositories/write/task-template-write.repository.ts` — `ITaskTemplateWriteRepository` + `TASK_TEMPLATE_WRITE_REPOSITORY` token
- [ ] 2.28 Create `src/contexts/tasks/domain/repositories/write/task-write.repository.ts` — `ITaskWriteRepository` + `TASK_WRITE_REPOSITORY` token; includes `updateStatus(id, status, metadata)` and `updateQueueJobId(id, queueJobId)`
- [ ] 2.29 Create `src/contexts/tasks/domain/repositories/read/task-template-read.repository.ts` — `ITaskTemplateReadRepository` + `TASK_TEMPLATE_READ_REPOSITORY` token
- [ ] 2.30 Create `src/contexts/tasks/domain/repositories/read/task-read.repository.ts` — `ITaskReadRepository` + `TASK_READ_REPOSITORY` token; `findByCriteria` supports `status`, `templateId`, `userId` filters
- [ ] 2.31 Create `src/contexts/tasks/domain/aggregates/task-template.aggregate.ts` — fields: id, name, description(nullable), handlerKey, defaultPriority, defaultRetryCount, defaultBackoffStrategy, defaultTimeoutMs, maxConcurrency, userId; methods: `create()`, `update(partial)`; all fields as VOs
- [ ] 2.32 Create `src/contexts/tasks/domain/aggregates/task.aggregate.ts` — fields: id, templateId, status, payload(object), priority, delayMs(nullable), cronExpression(nullable), isRecurring, maxRuns(nullable), runCount, idempotencyKey(nullable), queueJobId(nullable), userId, scheduledAt(nullable), startedAt(nullable), completedAt(nullable), failedAt(nullable), cancelledAt(nullable); methods: `schedule()` → emits `TaskScheduledEvent`; `start()` → ACTIVE; `complete()` → COMPLETED; `fail(error)` → FAILED; `cancel()` → validates status is PENDING then emits `TaskCancelledEvent`; `sendToDlq(error)` → emits `TaskSentToDlqEvent`
- [ ] 2.33 Create `src/contexts/tasks/domain/builders/task-template.builder.ts` — extends `BaseBuilder<TaskTemplateAggregate, TaskTemplateViewModel>`
- [ ] 2.34 Create `src/contexts/tasks/domain/builders/task.builder.ts` — extends `BaseBuilder<TaskAggregate, TaskViewModel>`

---

## Phase 3: Application layer

- [ ] 3.1 Create `src/contexts/tasks/application/services/write/assert-task-template-exists/assert-task-template-exists.service.ts`
- [ ] 3.2 Create `src/contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service.ts`
- [ ] 3.3 Create `src/contexts/tasks/application/services/write/assert-task-cancellable/assert-task-cancellable.service.ts` — throws `TaskNotCancellableException` if status ≠ PENDING
- [ ] 3.4 Create `src/contexts/tasks/application/services/read/assert-task-template-view-model-exists/assert-task-template-view-model-exists.service.ts`
- [ ] 3.5 Create `src/contexts/tasks/application/services/read/assert-task-view-model-exists/assert-task-view-model-exists.service.ts`
- [ ] 3.6 Create `create-task-template` command + handler:
  - `create-task-template.command.ts` — `CreateTaskTemplateCommandInput` interface + `CreateTaskTemplateCommand` class with VO fields
  - `create-task-template.handler.ts` — builds aggregate, calls `create()`, saves, publishes events; logs completion
- [ ] 3.7 Create `update-task-template` command + handler:
  - `update-task-template.command.ts`
  - `update-task-template.handler.ts` — `AssertTaskTemplateExistsService`; calls `update(partial)`; saves; publishes
- [ ] 3.8 Create `schedule-task` command + handler:
  - `schedule-task.command.ts` — `ScheduleTaskCommandInput`: `{ templateId, payload?, priority?, delayMs?, cronExpression?, isRecurring?, maxRuns?, idempotencyKey? }`
  - `schedule-task.handler.ts`:
    1. `AssertTaskTemplateExistsService` (loads template primitives for defaults)
    2. Idempotency check: if `idempotencyKey` provided, query existing PENDING/ACTIVE task with same key → throw `TaskDuplicateIdempotencyKeyException` with existing task ID
    3. Build `TaskAggregate`; call `schedule()`; save to DB (status = PENDING)
    4. `ITaskQueueProvider.enqueue(ITaskQueueJob)` → get `queueJobId`
    5. `taskWriteRepository.updateQueueJobId(taskId, queueJobId)`
    6. Publish `TaskScheduledEvent`; return `taskId`
- [ ] 3.9 Create `cancel-task` command + handler:
  - `cancel-task.command.ts`
  - `cancel-task.handler.ts`:
    1. `AssertTaskExistsService`
    2. `AssertTaskCancellableService`
    3. `ITaskQueueProvider.cancel(task.queueJobId)`
    4. `task.cancel()` → save → publish `TaskCancelledEvent`
- [ ] 3.10 Create `task-template-find-by-id` query + handler:
  - `task-template-find-by-id.query.ts`
  - `task-template-find-by-id.handler.ts` — uses read repo; `AssertTaskTemplateViewModelExistsService`
- [ ] 3.11 Create `task-template-find-by-criteria` query + handler — `Criteria`-based; returns paginated `TaskTemplateViewModel[]`
- [ ] 3.12 Create `task-find-by-id` query + handler — reads by id + userId (ownership check → 404 if wrong user)
- [ ] 3.13 Create `task-find-by-criteria` query + handler — filters: `status?`, `templateId?`; always scoped to `userId`; paginated
- [ ] 3.14 Create `task-run-find-by-task` query + handler — reads `task_runs` by `taskId`; ordered by `attempt ASC`

---

## Phase 4: Infrastructure layer

- [ ] 4.1 Create `src/contexts/tasks/infrastructure/persistence/typeorm/entities/task-template.entity.ts` — maps `task_templates` table
- [ ] 4.2 Create `src/contexts/tasks/infrastructure/persistence/typeorm/entities/task.entity.ts` — maps `tasks` table; relation to `TaskTemplateEntity`
- [ ] 4.3 Create `src/contexts/tasks/infrastructure/persistence/typeorm/entities/task-run.entity.ts` — maps `task_runs` table; relation to `TaskEntity`
- [ ] 4.4 Create `src/contexts/tasks/infrastructure/persistence/typeorm/mappers/task-template-typeorm.mapper.ts` — `toDomain()` + `toPersistence()`
- [ ] 4.5 Create `src/contexts/tasks/infrastructure/persistence/typeorm/mappers/task-typeorm.mapper.ts`
- [ ] 4.6 Create `src/contexts/tasks/infrastructure/persistence/typeorm/repositories/task-template-typeorm-write.repository.ts` — extends `BaseDatabaseRepository`; implements `ITaskTemplateWriteRepository`
- [ ] 4.7 Create `src/contexts/tasks/infrastructure/persistence/typeorm/repositories/task-template-typeorm-read.repository.ts` — implements `ITaskTemplateReadRepository`
- [ ] 4.8 Create `src/contexts/tasks/infrastructure/persistence/typeorm/repositories/task-typeorm-write.repository.ts` — implements `ITaskWriteRepository`; `updateStatus()` patches `status` + relevant timestamp; `updateQueueJobId()` patches `queue_job_id`
- [ ] 4.9 Create `src/contexts/tasks/infrastructure/persistence/typeorm/repositories/task-typeorm-read.repository.ts` — implements `ITaskReadRepository`; `findByCriteria` supports `status`, `templateId`, `userId` + pagination
- [ ] 4.10 Create `src/contexts/tasks/infrastructure/persistence/typeorm/task-run-typeorm.repository.ts` — `@Injectable()`; raw TypeORM repository for `TaskRunEntity`; methods: `create(run): Promise<void>`, `updateProgress(id, pct): Promise<void>`, `complete(id, endedAt): Promise<void>`, `fail(id, error, endedAt): Promise<void>`, `findByTaskId(taskId): Promise<TaskRunEntity[]>`
- [ ] 4.11 Create migration `src/database/migrations/1780000000011-CreateTaskTemplates.ts` — `up()` creates `task_templates`; `down()` drops it
- [ ] 4.12 Create migration `src/database/migrations/1780000000012-CreateTasks.ts` — `up()` creates `tasks` + indexes; `down()` drops table
- [ ] 4.13 Create migration `src/database/migrations/1780000000013-CreateTaskRuns.ts` — `up()` creates `task_runs`; `down()` drops it

---

## Phase 5: Transport layer

- [ ] 5.1 Create `src/contexts/tasks/transport/graphql/enums/tasks-registered-enums.graphql.ts` — `registerEnumType` for `TaskStatusEnum` and `TaskBackoffStrategyEnum`
- [ ] 5.2 Create REST request DTOs:
  - `create-task-template-rest.dto.ts`
  - `update-task-template-rest.dto.ts`
  - `schedule-task-rest.dto.ts` — `templateId` (required), `payload?`, `priority?`, `delayMs?`, `cronExpression?`, `isRecurring?`, `maxRuns?`, `idempotencyKey?`
  - `cancel-task-rest.dto.ts` (empty body; id from URL param)
- [ ] 5.3 Create REST response DTOs:
  - `task-template-rest-response.dto.ts`
  - `task-rest-response.dto.ts`
- [ ] 5.4 Create `src/contexts/tasks/transport/rest/mappers/task-template/task-template-rest.mapper.ts`
- [ ] 5.5 Create `src/contexts/tasks/transport/rest/mappers/task/task-rest.mapper.ts`
- [ ] 5.6 Create `src/contexts/tasks/transport/rest/controllers/task-templates.controller.ts` — routes: POST `/task-templates`, PATCH `/:id`, GET `/:id`, GET `/`; guard: `JwtAuthGuard`; logs entry
- [ ] 5.7 Create `src/contexts/tasks/transport/rest/controllers/tasks.controller.ts` — routes: POST `/tasks` (schedule), DELETE `/:id/cancel`, GET `/:id`, GET `/`, GET `/:id/runs`; guard: `JwtAuthGuard`; logs entry
- [ ] 5.8 Create GraphQL request DTOs:
  - `create-task-template-graphql.dto.ts` (`@InputType()`)
  - `update-task-template-graphql.dto.ts`
  - `schedule-task-graphql.dto.ts`
  - `task-template-find-by-criteria-graphql.dto.ts`
  - `task-find-by-criteria-graphql.dto.ts`
- [ ] 5.9 Create GraphQL response DTOs:
  - `task-template-graphql-response.dto.ts` (`@ObjectType()`)
  - `task-graphql-response.dto.ts`
  - `paginated-task-template-result.dto.ts`
  - `paginated-task-result.dto.ts`
- [ ] 5.10 Create `src/contexts/tasks/transport/graphql/mappers/task-template-graphql.mapper.ts`
- [ ] 5.11 Create `src/contexts/tasks/transport/graphql/mappers/task-graphql.mapper.ts`
- [ ] 5.12 Create `src/contexts/tasks/transport/graphql/resolvers/task-template-queries.resolver.ts` — `taskTemplate(id)`, `taskTemplates(criteria)`; guard: `JwtAuthGuard`
- [ ] 5.13 Create `src/contexts/tasks/transport/graphql/resolvers/task-template-mutations.resolver.ts` — `createTaskTemplate`, `updateTaskTemplate`; guard: `JwtAuthGuard`
- [ ] 5.14 Create `src/contexts/tasks/transport/graphql/resolvers/task-queries.resolver.ts` — `task(id)`, `tasks(criteria)`, `taskRuns(taskId)`
- [ ] 5.15 Create `src/contexts/tasks/transport/graphql/resolvers/task-mutations.resolver.ts` — `scheduleTask`, `cancelTask`

---

## Phase 6: Module wiring

- [ ] 6.1 Create `src/contexts/tasks/tasks.module.ts`:
  ```
  COMMAND_HANDLERS: [CreateTaskTemplateCommandHandler, UpdateTaskTemplateCommandHandler, ScheduleTaskCommandHandler, CancelTaskCommandHandler]
  QUERY_HANDLERS: [TaskTemplateFindByIdQueryHandler, TaskTemplateFindByCriteriaQueryHandler, TaskFindByIdQueryHandler, TaskFindByCriteriaQueryHandler, TaskRunFindByTaskQueryHandler]
  APPLICATION_SERVICES: [AssertTaskTemplateExistsService, AssertTaskExistsService, AssertTaskCancellableService, AssertTaskTemplateViewModelExistsService, AssertTaskViewModelExistsService]
  DOMAIN_BUILDERS: [TaskTemplateBuilder, TaskBuilder]
  INFRASTRUCTURE_REPOSITORIES: [
    { provide: TASK_TEMPLATE_WRITE_REPOSITORY, useClass: TaskTemplateTypeOrmWriteRepository },
    { provide: TASK_TEMPLATE_READ_REPOSITORY, useClass: TaskTemplateTypeOrmReadRepository },
    { provide: TASK_WRITE_REPOSITORY, useClass: TaskTypeOrmWriteRepository },
    { provide: TASK_READ_REPOSITORY, useClass: TaskTypeOrmReadRepository },
  ]
  INFRASTRUCTURE_MAPPERS: [TaskTemplateTypeOrmMapper, TaskTypeOrmMapper]
  INFRASTRUCTURE_ENTITIES: TypeOrmModule.forFeature([TaskTemplateEntity, TaskEntity, TaskRunEntity])
  TRANSPORT_PROVIDERS: [TaskTemplateQueriesResolver, TaskTemplateMutationsResolver, TaskQueriesResolver, TaskMutationsResolver, TaskTemplatesController, TasksController, TaskTemplateRestMapper, TaskRestMapper, TaskTemplateGraphQLMapper, TaskGraphQLMapper]
  + TaskRunTypeOrmRepository (standalone, no token)
  imports: [CqrsModule, TypeOrmModule.forFeature([...]), TaskQueueModule (already global)]
  ```
- [ ] 6.2 Modify `src/app.module.ts` — add `TaskQueueModule` and `TasksModule` to `imports[]`
- [ ] 6.3 Modify `.env.example` — add:
  ```
  TASK_PROVIDER=redis
  TASK_REDIS_URL=redis://localhost:6379
  TASK_IDEMPOTENCY_TTL_SECONDS=3600
  ```
- [ ] 6.4 Inspect `src/core/filters/base-exception.filter.ts` — if filter enumerates exceptions, add mappings for `TaskTemplateNotFoundException`, `TaskNotFoundException`, `TaskNotCancellableException`, `TaskDuplicateIdempotencyKeyException` (→ 409), `TaskHandlerNotFoundException` (→ 500)

---

## Phase 7: Example domain handlers (Gardenia)

These live in the bounded contexts that own the entities, not in `tasks/`. They demonstrate how to plug in.

- [ ] 7.1 Create `src/contexts/plants/application/task-handlers/water-plant.task-handler.ts` — `handlerKey = 'water-plant'`; payload `{ plantId: string }`; registers in `TaskHandlerRegistry` on `onModuleInit`; uses `QueryBus` to load plant
- [ ] 7.2 Create `src/contexts/planting-spots/application/task-handlers/water-spot.task-handler.ts` — `handlerKey = 'water-spot'`; payload `{ plantingSpotId: string }`
- [ ] 7.3 Create default `TaskTemplate` seeds (optional migration or fixture): `water-plant`, `water-spot`, `prune-plant`, `harvest-plant`, `prepare-winter`, `plant-seedling` — with sensible defaults (priority 5, 3 retries, exponential backoff, 30s timeout)
- [ ] 7.4 Register example handlers in `PlantsModule` and `PlantingSpotsModule` respectively (add to providers array)

---

## Phase 8: Tests

- [ ] 8.1 Unit — `task-priority.value-object.spec.ts`: 1 accepted, 10 accepted, 0 throws, 11 throws
- [ ] 8.2 Unit — `task-cron-expression.value-object.spec.ts`: valid cron accepted; invalid string throws
- [ ] 8.3 Unit — `task.aggregate.spec.ts`:
  - `schedule()` → status PENDING, emits `TaskScheduledEvent`
  - `cancel()` on PENDING → status CANCELLED, emits `TaskCancelledEvent`
  - `cancel()` on ACTIVE → throws `TaskNotCancellableException`
  - `complete()` → status COMPLETED
  - `fail(error)` → status FAILED
- [ ] 8.4 Unit — `task-template.aggregate.spec.ts`: `create()` emits event; `update()` changes fields
- [ ] 8.5 Unit — `assert-task-cancellable.service.spec.ts`: PENDING passes; ACTIVE/COMPLETED/FAILED/CANCELLED throw
- [ ] 8.6 Unit — `task-handler.registry.spec.ts`: `register()` + `dispatch()` calls handler; unknown key throws
- [ ] 8.7 Unit — `schedule-task.handler.spec.ts`:
  - Happy path: saves task + calls `ITaskQueueProvider.enqueue` + publishes event
  - Duplicate idempotency key → throws `TaskDuplicateIdempotencyKeyException`
  - Unknown template → throws 404
- [ ] 8.8 Unit — `cancel-task.handler.spec.ts`:
  - PENDING → cancels + calls `ITaskQueueProvider.cancel`
  - ACTIVE → throws 409
- [ ] 8.9 Integration — `task-template-typeorm-write.repository.integration-spec.ts` + `task-template-typeorm-read.repository.integration-spec.ts`: save + findById; findByCriteria with userId filter
- [ ] 8.10 Integration — `task-typeorm-write.repository.integration-spec.ts` + `task-typeorm-read.repository.integration-spec.ts`: save task; `updateStatus`; `updateQueueJobId`; `findByCriteria` status filter; user-scoped isolation
- [ ] 8.11 Integration — `task-run-typeorm.repository.integration-spec.ts`: `create` + `updateProgress` + `complete`; `findByTaskId` ordered by attempt
- [ ] 8.12 E2E — `task-templates-rest.e2e-spec.ts`: POST creates; GET by id; GET list; PATCH updates; JwtAuthGuard enforced (401 without token)
- [ ] 8.13 E2E — `tasks-rest.e2e-spec.ts`:
  - POST `/tasks` → 201 with taskId (mock BullMQ provider)
  - DELETE `/:id/cancel` → 200 for PENDING; 409 for ACTIVE
  - GET `/:id` → 200 with status
  - GET `/:id/runs` → 200 with empty array initially
  - Invalid templateId → 404
  - Duplicate idempotencyKey → 409
- [ ] 8.14 E2E — `tasks-graphql.e2e-spec.ts`: `scheduleTask` mutation + `task(id)` query; `cancelTask` mutation
