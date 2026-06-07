# Queue Module (`src/core/queue`)

This is the **infrastructure core** of the task system. It is provider-agnostic: the same interface works with Redis/BullMQ today and can be swapped to SQS or RabbitMQ without touching any domain code.

It is declared as `@Global()`, so every module in the app can inject its exports (`TASK_QUEUE_PROVIDER` and `TaskHandlerRegistry`) without explicitly importing `QueueModule`.

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [How It Works](#how-it-works)
3. [Handler Auto-Discovery](#handler-auto-discovery)
4. [Job Lifecycle Events](#job-lifecycle-events)
5. [Implementing a New Provider](#implementing-a-new-provider)
6. [BullMQ Specifics](#bullmq-specifics)
7. [Environment Variables](#environment-variables)

---

## Directory Structure

```
src/core/queue/
├── adapters/
│   ├── bullmq/
│   │   └── bullmq-task-queue.adapter.ts        # Production Redis/BullMQ adapter
│   ├── sqs/
│   │   ├── sqs-task-queue.adapter.ts           # Production AWS SQS adapter
│   │   └── sqs-task-queue-stub.adapter.ts      # Legacy stub (kept for reference)
│   └── rabbitmq/
│       └── rabbitmq-task-queue-stub.adapter.ts # RabbitMQ stub (not implemented)
├── config/
│   └── queue.config.ts                    # Reads TASK_* env vars
├── decorators/
│   └── register-task-handler.decorator.ts # @RegisterTaskHandler(key)
├── events/
│   └── task-job-lifecycle.events.ts       # Events published on job state changes
├── interfaces/
│   ├── task-handler.interface.ts          # ITaskHandler, ITaskQueueContext
│   └── task-queue-job.interface.ts        # ITaskQueueJob (enqueue payload)
├── ports/
│   └── task-queue-provider.port.ts        # ITaskQueueProvider contract + DI token
├── registry/
│   └── task-handler.registry.ts           # Auto-discovers and dispatches handlers
└── queue.module.ts                        # @Global() NestJS module
```

---

## How It Works

```
                    ┌──────────────────────────────────┐
                    │           QueueModule             │
                    │  (global, loaded once at startup) │
                    └───────────────┬──────────────────┘
                                    │ provides
               ┌────────────────────┼───────────────────────┐
               │                    │                       │
               ▼                    ▼                       ▼
    TASK_QUEUE_PROVIDER      TaskHandlerRegistry      EventBus
    (BullMQ / SQS / ...)     (auto-discovered)    (NestJS CqrsModule)
               │                    │                       │
               │ enqueue()          │ dispatch()            │ publishes
               ▼                    ▼                       ▼
         Redis queue ──► Worker ──► handler.execute()  TaskJob*Events
```

1. **Scheduling** — any command handler injects `TASK_QUEUE_PROVIDER` and calls `enqueue(job)`. The job lands in the Redis queue.
2. **Processing** — the BullMQ `Worker` picks up the job and calls `TaskHandlerRegistry.dispatch(handlerKey, payload, ctx)`.
3. **Execution** — the registry finds the handler registered under that key and calls `execute()`.
4. **Lifecycle events** — as the job progresses, the adapter publishes NestJS events (`TaskJobStartedEvent`, etc.) onto the global `EventBus`. Any module can listen to these.

---

## Handler Auto-Discovery

Task handlers do not need to register themselves manually. Just decorate the class with `@RegisterTaskHandler` and declare it as a NestJS provider:

```typescript
import { Injectable } from '@nestjs/common';
import { RegisterTaskHandler } from '@core/queue/decorators/register-task-handler.decorator';
import { ITaskHandler, ITaskQueueContext } from '@core/queue/interfaces/task-handler.interface';

@Injectable()
@RegisterTaskHandler('my-task-key')   // ← unique, kebab-case
export class MyTaskHandler implements ITaskHandler {
  readonly handlerKey = 'my-task-key';

  async execute(payload: Record<string, unknown>, ctx: ITaskQueueContext): Promise<void> {
    await ctx.reportProgress(50);
    // ... do work ...
    await ctx.reportProgress(100);
  }
}
```

**How discovery works internally:**

`TaskHandlerRegistry` implements `OnApplicationBootstrap`. When NestJS finishes wiring the DI container, it calls `onApplicationBootstrap()`, which:

1. Calls `DiscoveryService.getProviders()` to get every provider in the app.
2. For each provider, reads the `TASK_HANDLER_METADATA` symbol from its constructor using `Reflector`.
3. If the symbol is set (i.e. the class has `@RegisterTaskHandler`), stores the instance in a `Map<key, ITaskHandler>`.

The handler key must be **globally unique** across all modules. Use `context-verb` naming to avoid collisions — e.g. `water-plant`, `prune-plant`, `water-spot`.

---

## Job Lifecycle Events

When a job changes state, the BullMQ adapter publishes events onto the NestJS `EventBus`. Import them from the shared events file:

```typescript
import {
  TaskJobStartedEvent,
  TaskJobCompletedEvent,
  TaskJobFailedEvent,
  TaskJobProgressEvent,
} from '@core/queue/events/task-job-lifecycle.events';
```

| Event | Payload | When published |
|-------|---------|----------------|
| `TaskJobStartedEvent` | `taskId`, `queueJobId` | Worker picks up the job |
| `TaskJobProgressEvent` | `taskId`, `progress` (0–100) | Handler calls `ctx.reportProgress()` |
| `TaskJobCompletedEvent` | `taskId` | Handler finishes without throwing |
| `TaskJobFailedEvent` | `taskId`, `error`, `isFinal` | Job throws; `isFinal=true` when retries are exhausted |

Listen to them with a standard NestJS `@EventsHandler`:

```typescript
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TaskJobCompletedEvent } from '@core/queue/events/task-job-lifecycle.events';

@EventsHandler(TaskJobCompletedEvent)
export class MyCompletedHandler implements IEventHandler<TaskJobCompletedEvent> {
  async handle(event: TaskJobCompletedEvent): Promise<void> {
    console.log(`Task ${event.taskId} done`);
  }
}
```

> The `tasks` bounded context (`src/contexts/tasks`) already listens to all four events to keep the `tasks` and `task_runs` tables in sync.

---

## SQS Specifics

The SQS adapter uses `@aws-sdk/client-sqs` with long-polling (20s) and processes up to 10 messages per poll cycle.

**Credentials** — if `TASK_SQS_ACCESS_KEY_ID` / `TASK_SQS_SECRET_ACCESS_KEY` are left empty, the SDK falls back to the standard AWS credential chain (IAM role, environment, `~/.aws/credentials`). In production on ECS/EC2/Lambda, leave them empty and use an IAM role — it is more secure.

**Retry & DLQ** — failed messages are NOT deleted from the queue. SQS makes them visible again after the `VisibilityTimeout` (30 s). Configure a **redrive policy** on your SQS queue with `maxReceiveCount` set to `defaultRetryCount + 1`. When that threshold is crossed, SQS automatically moves the message to the dead-letter queue (DLQ). The adapter reads `ApproximateReceiveCount` to set `isFinal` on `TaskJobFailedEvent`.

**Cancellation caveat** — SQS has no delete-by-MessageId API before a message is received. Cancellation is implemented as an in-memory denylist: when the consumer receives a cancelled message, it skips and deletes it without calling the handler. If the process restarts before the message is consumed, the denylist is lost and the task will execute once before the `CANCELLED` status in the DB causes it to be ignored at the domain level.

**Cron / recurring tasks** — SQS does not support scheduled or recurring messages natively. Passing `cronExpression` logs a warning and enqueues the job once. For recurring jobs use **Amazon EventBridge Scheduler** to trigger the `POST /tasks` endpoint on a cron schedule.

**Priority** — SQS standard queues have no native priority. The priority value is stored as a `MessageAttribute` for observability but is not enforced by the broker. If strict priority matters, use the Redis/BullMQ provider.

**Setting up the SQS queue (one-time)**

```bash
# Standard queue
aws sqs create-queue --queue-name gardenia-tasks

# Or FIFO (for strict ordering per message group)
aws sqs create-queue \
  --queue-name gardenia-tasks.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=false

# Attach a redrive policy (DLQ must exist first)
aws sqs set-queue-attributes \
  --queue-url $TASK_SQS_QUEUE_URL \
  --attributes '{"RedrivePolicy":"{\"deadLetterTargetArn\":\"arn:aws:sqs:...:gardenia-tasks-dlq\",\"maxReceiveCount\":\"4\"}"}'
```

---

## Implementing a New Provider

To add a RabbitMQ provider (or any other):

**1. Implement the interface**

```typescript
// src/core/queue/adapters/rabbitmq/rabbitmq-task-queue.adapter.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ITaskQueueJob } from '@core/queue/interfaces/task-queue-job.interface';
import { ITaskQueueProvider } from '@core/queue/ports/task-queue-provider.port';

@Injectable()
export class RabbitMqTaskQueueAdapter
  implements ITaskQueueProvider, OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    // connect, declare exchange/queue, start consumer
  }
  async onModuleDestroy(): Promise<void> {
    // close channel and connection
  }
  async enqueue(job: ITaskQueueJob): Promise<string> {
    // publish to exchange, return correlation ID
  }
  async cancel(queueJobId: string): Promise<void> {
    // nack / reject by correlation ID (or denylist approach like SQS)
  }
}
```

**2. Register it in `queue.module.ts`** — replace the stub in the providers array and factory.

**3. Set the env var**

```
TASK_PROVIDER=rabbitmq
```

No changes to domain code, handlers, or the `tasks` context are required.

---

## BullMQ Specifics

The BullMQ adapter uses two queues in Redis:

| Queue | Purpose |
|-------|---------|
| `tasks-main` | Normal job processing |
| `tasks-dlq` | Dead-letter queue — jobs moved here after all retries are exhausted |

**Priority mapping** — BullMQ treats lower numbers as higher priority (1 = highest). The domain uses the opposite convention (10 = highest), so the adapter inverts it:

```
BullMQ priority = 11 - domain priority
```

**Connection** — the adapter parses `TASK_REDIS_URL` into `{ host, port, password }` to avoid a TypeScript version conflict between the project's `ioredis` and the one bundled inside BullMQ.

**Concurrency** — the worker defaults to `concurrency: 10` (10 jobs processed in parallel per Node.js process). To change this, update the `Worker` constructor options in `bullmq-task-queue.adapter.ts`.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TASK_PROVIDER` | `redis` | Active provider: `redis`, `sqs`, or `rabbitmq` |
| `TASK_IDEMPOTENCY_TTL_SECONDS` | `3600` | Consumed by the `tasks` context for idempotency checks |
| **Redis** | | |
| `TASK_REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| **SQS** | | |
| `TASK_SQS_QUEUE_URL` | *(required)* | Full SQS queue URL |
| `TASK_SQS_REGION` | `us-east-1` | AWS region |
| `TASK_SQS_ACCESS_KEY_ID` | *(empty = IAM role)* | AWS access key — leave empty in production |
| `TASK_SQS_SECRET_ACCESS_KEY` | *(empty = IAM role)* | AWS secret key — leave empty in production |
