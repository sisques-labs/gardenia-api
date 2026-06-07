# Tasks Module

The Tasks module provides a **generic, queue-backed task scheduling system** for Gardenia API. It lets you define reusable task templates, schedule one-off or recurring executions, track progress in real time, and handle retries and failures automatically.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Concepts](#key-concepts)
4. [Task Lifecycle](#task-lifecycle)
5. [How to Add a New Task Type](#how-to-add-a-new-task-type)
6. [Scheduling a Task](#scheduling-a-task)
7. [Recurring Tasks](#recurring-tasks)
8. [Retry & Backoff](#retry--backoff)
9. [Idempotency](#idempotency)
10. [Progress Tracking](#progress-tracking)
11. [REST API Reference](#rest-api-reference)
12. [GraphQL API Reference](#graphql-api-reference)
13. [Environment Variables](#environment-variables)
14. [Database Tables](#database-tables)
15. [Queue Providers](#queue-providers)

---

## Overview

The system is split into two layers:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Infrastructure** | `src/core/queue/` | Queue connection (BullMQ/Redis), handler auto-discovery, job lifecycle events |
| **Domain** | `src/contexts/tasks/` | Task templates, task execution records, REST/GraphQL API |

The two layers communicate through NestJS events (`TaskJobStartedEvent`, `TaskJobCompletedEvent`, etc.) so neither layer depends directly on the other.

---

## Architecture

```
                        ┌─────────────────────────────────┐
                        │         REST / GraphQL           │
                        │  POST /tasks  ·  GET /tasks/:id  │
                        └────────────────┬────────────────-┘
                                         │
                              ScheduleTaskCommand
                                         │
                        ┌────────────────▼────────────────┐
                        │       Tasks Bounded Context      │
                        │  TaskTemplate  ·  Task  aggregate│
                        │  task_templates  ·  tasks tables │
                        └────────────────┬────────────────-┘
                                         │ ITaskQueueProvider.enqueue()
                        ┌────────────────▼────────────────┐
                        │         src/core/queue/          │
                        │    BullMQ  ──►  Redis queue      │
                        │    Worker picks up job           │
                        │    TaskHandlerRegistry.dispatch()│
                        └────────┬─────────────┬──────────┘
                                 │             │
                    @RegisterTaskHandler   NestJS EventBus
                                 │             │
               ┌─────────────────┘    ┌────────▼─────────┐
               │  WaterPlantTaskHandler│  Event Handlers  │
               │  PrunePlantTaskHandler│  (update task    │
               │  HarvestPlantTaskHandler  status + runs) │
               │  WaterSpotTaskHandler └──────────────────┘
               │  PrepareWinterTaskHandler
               └─ PlantSeedlingTaskHandler
```

---

## Key Concepts

### TaskTemplate

A **template** is a reusable definition of a task type. Think of it as a blueprint:

```
name:                    "Water Plant"
handlerKey:              "water-plant"      ← must match a registered handler
defaultPriority:         5                  ← 1 (lowest) to 10 (highest)
defaultRetryCount:       3
defaultBackoffStrategy:  EXPONENTIAL
defaultTimeoutMs:        30000
maxConcurrency:          5
```

Templates are created once and reused every time you schedule that kind of work.

### Task

A **task** is a concrete execution request created from a template:

```
templateId:       → points to the template
payload:          { plantId: "uuid-123" }   ← arbitrary JSON for the handler
status:           PENDING → ACTIVE → COMPLETED | FAILED | CANCELLED
priority:         overrides template default (optional)
cronExpression:   "0 8 * * *"  ← optional, makes it recurring
idempotencyKey:   "water-plant-123-2026-06-07"  ← optional deduplication key
```

### TaskHandler

A **handler** is the class that contains the actual business logic for a task type. Each handler is decorated with `@RegisterTaskHandler('handler-key')` and auto-discovered at startup — no manual wiring needed.

### TaskRun

Every time a task executes (including retries), a **task_run** record is created. It tracks attempt number, progress (0–100), start/end timestamps, and any error message.

---

## Task Lifecycle

```
          schedule()
PENDING ──────────────► ACTIVE ──────────────► COMPLETED
   │                      │
   │ cancel()             │ fail() [isFinal]
   ▼                      ▼
CANCELLED              FAILED
```

| Status | Meaning |
|--------|---------|
| `PENDING` | Enqueued in Redis, waiting for a worker |
| `ACTIVE` | A worker is currently executing it |
| `COMPLETED` | Finished successfully |
| `FAILED` | Exhausted all retries |
| `CANCELLED` | Cancelled by the user before execution started |

> A task can only be cancelled while it is `PENDING`. Once `ACTIVE`, it must complete or fail.

---

## How to Add a New Task Type

Adding a new task type takes three steps.

### Step 1 — Create the handler

Create a handler file in the bounded context that owns the logic. For example, to add a "fertilize plant" task in the `plants` context:

```typescript
// src/contexts/plants/application/task-handlers/fertilize-plant.task-handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { RegisterTaskHandler } from '@core/queue/decorators/register-task-handler.decorator';
import { ITaskHandler, ITaskQueueContext } from '@core/queue/interfaces/task-handler.interface';

@Injectable()
@RegisterTaskHandler('fertilize-plant')   // ← unique key, kebab-case
export class FertilizePlantTaskHandler implements ITaskHandler {
  readonly handlerKey = 'fertilize-plant';
  private readonly logger = new Logger(FertilizePlantTaskHandler.name);

  constructor(private readonly queryBus: QueryBus) {}

  async execute(payload: Record<string, unknown>, ctx: ITaskQueueContext): Promise<void> {
    const plantId = payload.plantId as string;

    this.logger.log(`Fertilizing plant ${plantId} (job: ${ctx.jobId})`);
    await ctx.reportProgress(20);

    // use queryBus / commandBus for domain operations
    // e.g. await this.queryBus.execute(new PlantFindByIdQuery(plantId));

    await ctx.reportProgress(100);
    this.logger.log(`Plant ${plantId} fertilized`);
  }
}
```

The `@RegisterTaskHandler('fertilize-plant')` decorator is all you need — the registry scans all NestJS providers at startup and auto-registers any class with this decorator. No `OnModuleInit`, no registry injection.

### Step 2 — Declare it as a provider

Add the handler to its module's providers array:

```typescript
// src/contexts/plants/plants.module.ts
import { FertilizePlantTaskHandler } from './application/task-handlers/fertilize-plant.task-handler';

const TASK_HANDLERS = [
  WaterPlantTaskHandler,
  PrunePlantTaskHandler,
  HarvestPlantTaskHandler,
  FertilizePlantTaskHandler,   // ← add here
];
```

### Step 3 — Create a TaskTemplate via the API

```bash
POST /task-templates
{
  "name": "Fertilize Plant",
  "handlerKey": "fertilize-plant",
  "defaultPriority": 5,
  "defaultRetryCount": 2,
  "defaultBackoffStrategy": "EXPONENTIAL",
  "defaultTimeoutMs": 60000,
  "maxConcurrency": 3
}
```

That's it. You can now schedule tasks of this type.

---

## Scheduling a Task

```bash
POST /tasks
{
  "templateId": "<task-template-uuid>",
  "payload": { "plantId": "uuid-123" },
  "priority": 7,             // optional, overrides template default
  "delayMs": 5000,           // optional, delay before execution
  "idempotencyKey": "fertilize-uuid-123-2026-06-07"  // optional
}
```

The response is the new task's UUID. Use it to poll status:

```bash
GET /tasks/<task-uuid>
```

---

## Recurring Tasks

Pass a standard 5-field cron expression to make a task run on a schedule:

```bash
POST /tasks
{
  "templateId": "<uuid>",
  "payload": { "plantId": "uuid-123" },
  "cronExpression": "0 8 * * *",   // every day at 08:00
  "isRecurring": true,
  "maxRuns": 30                    // optional, stop after N executions
}
```

The cron is managed by BullMQ directly in Redis. Each scheduled run creates a new `task_run` record.

---

## Retry & Backoff

Retry behaviour is configured per template:

| Setting | Description |
|---------|-------------|
| `defaultRetryCount` | How many times to retry after failure (0 = no retries) |
| `defaultBackoffStrategy` | `EXPONENTIAL` (doubles delay each retry), `LINEAR`, or `FIXED` |

When all retries are exhausted, the job moves to the **dead-letter queue** (`tasks-dlq` in Redis) and the task's status becomes `FAILED`. You can inspect or replay DLQ jobs using a Redis client.

---

## Idempotency

To prevent duplicate task scheduling (e.g. from a webhook retried by an external system), pass an `idempotencyKey`:

```bash
POST /tasks
{
  "templateId": "...",
  "payload": { "plantId": "uuid-123" },
  "idempotencyKey": "water-uuid-123-2026-06-07"
}
```

If a task with the same key already exists in `PENDING` or `ACTIVE` state, the API returns **409 Conflict** with the existing task's ID. Completed/failed/cancelled tasks do not block new scheduling with the same key.

---

## Progress Tracking

Inside a task handler, call `ctx.reportProgress(percent)` to update progress:

```typescript
async execute(payload, ctx) {
  await ctx.reportProgress(0);
  // ... do work ...
  await ctx.reportProgress(50);
  // ... more work ...
  await ctx.reportProgress(100);
}
```

Progress is stored per `task_run` record and can be read via:

```bash
GET /tasks/<task-uuid>/runs
```

---

## REST API Reference

### Task Templates

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/task-templates` | Create a new template |
| `PATCH` | `/task-templates/:id` | Update an existing template |
| `GET` | `/task-templates/:id` | Get a template by ID |
| `GET` | `/task-templates` | List templates (paginated, filterable) |

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tasks` | Schedule a new task |
| `DELETE` | `/tasks/:id/cancel` | Cancel a pending task |
| `GET` | `/tasks/:id` | Get a task by ID |
| `GET` | `/tasks` | List tasks (paginated, filterable) |
| `GET` | `/tasks/:id/runs` | Get all execution runs for a task |

---

## GraphQL API Reference

```graphql
# Queries
taskTemplate(id: ID!): TaskTemplate
taskTemplates(criteria: TaskTemplateFindByCriteriaInput): PaginatedTaskTemplateResult

task(id: ID!): Task
tasks(criteria: TaskFindByCriteriaInput): PaginatedTaskResult

# Mutations
createTaskTemplate(input: CreateTaskTemplateInput!): String   # returns ID
updateTaskTemplate(id: ID!, input: UpdateTaskTemplateInput!): Boolean
scheduleTask(input: ScheduleTaskInput!): String               # returns ID
cancelTask(id: ID!): Boolean
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TASK_PROVIDER` | `redis` | Queue provider: `redis`, `sqs`, or `rabbitmq` |
| `TASK_REDIS_URL` | `redis://localhost:6379` | Redis connection URL (used when `TASK_PROVIDER=redis`) |
| `TASK_IDEMPOTENCY_TTL_SECONDS` | `3600` | How long idempotency keys are checked back in time |

---

## Database Tables

### `task_templates`

Stores the reusable task type definitions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | varchar(255) | Unique display name |
| `description` | text | Optional description |
| `handler_key` | varchar(100) | Must match a `@RegisterTaskHandler` key |
| `default_priority` | smallint | 1–10 |
| `default_retry_count` | smallint | 0–10 |
| `default_backoff_strategy` | varchar | `exponential`, `linear`, `fixed` |
| `default_timeout_ms` | int | Milliseconds |
| `max_concurrency` | smallint | 1–100 |
| `user_id` | UUID | Owner |

### `tasks`

Each scheduled execution request.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `template_id` | UUID | FK to `task_templates` |
| `status` | varchar | `pending`, `active`, `completed`, `failed`, `cancelled` |
| `payload` | jsonb | Arbitrary data passed to the handler |
| `priority` | smallint | 1–10 |
| `delay_ms` | int | Delay before first execution |
| `cron_expression` | varchar | Cron schedule (recurring tasks) |
| `is_recurring` | boolean | |
| `max_runs` | int | Maximum executions for recurring tasks |
| `run_count` | int | How many times this task has executed |
| `idempotency_key` | varchar | Unique constraint, prevents duplicates |
| `queue_job_id` | varchar | BullMQ job ID |
| `user_id` | UUID | Owner |
| `scheduled_at` | timestamp | When the task was created |
| `started_at` | timestamp | When first execution began |
| `completed_at` | timestamp | |
| `failed_at` | timestamp | |
| `cancelled_at` | timestamp | |

### `task_runs`

One record per execution attempt.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `task_id` | UUID | FK to `tasks` |
| `attempt` | smallint | 1 for first try, 2 for first retry, etc. |
| `status` | varchar | `active`, `completed`, `failed` |
| `progress` | smallint | 0–100 |
| `error` | text | Error message if failed |
| `started_at` | timestamp | |
| `ended_at` | timestamp | |

---

## Queue Providers

The queue provider is selected at startup via `TASK_PROVIDER`. Switching provider requires no code changes.

| Provider | Status | Notes |
|----------|--------|-------|
| `redis` (BullMQ) | **Production-ready** | Default. Requires Redis. |
| `sqs` | **Production-ready** | Requires `TASK_SQS_QUEUE_URL` and AWS credentials (or IAM role). |
| `rabbitmq` | Stub | Throws `NotImplementedException`. |

To implement a new provider, create a class that implements `ITaskQueueProvider` from `@core/queue/ports/task-queue-provider.port.ts`, register it in `src/core/queue/queue.module.ts`, and add the provider name to the factory switch.
