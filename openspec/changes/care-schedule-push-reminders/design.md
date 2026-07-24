# Design: Care Schedule Push Reminders (`notifications` + `care-schedule`)

> Revision 2 — replaces the cron-based design with a Redis/BullMQ delayed-job
> design. No `@Cron` anywhere in this change. See proposal.md's revision note
> for why, and Risks for the explicitly-accepted trade-off (no reconciliation
> safety net).

## Technical Approach

Two coordinated pieces:

1. **`care-schedule`** — on every mutation that changes *whether* or *when* a
   schedule is due (`create`, `complete`, `active` toggling, `delete`), it
   schedules or cancels exactly one delayed job in Redis, keyed by the
   schedule's own id. The job's `delay` **is** the "wait until due" logic —
   there is nothing else deciding "is it time yet."
2. **`notifications`** — a small, standalone bounded context whose only job
   is "remember a user's push subscriptions, and send a push to all of
   them." It gains one new entry point in this revision: a BullMQ processor
   that consumes the jobs `care-schedule` (or, in principle, any future
   producer) enqueues, and turns each into a `SendPushNotificationCommand`.

The two are connected exclusively through the `push-notifications` BullMQ
queue — an async, durable, retryable transport — instead of the previous
revision's synchronous `CommandBus.execute()` call. The port/adapter seam
(`care-schedule/application/ports/` + `care-schedule/infrastructure/adapters/`)
is unchanged in *shape*; only what the adapter talks to changes.

## Why this removes the cron entirely

A polling cron exists to answer "has time T arrived yet?" by repeatedly
asking a database. A delayed job answers the same question by **sleeping
until T**, with Redis (via BullMQ's internal sorted-set + a lightweight
poller inside the BullMQ *library*, not our application code) doing the
"has T arrived" check for us, at a much finer granularity and without our
domain ever holding a "have I already reminded for this occurrence" flag —
the job existing (or not) IS that flag.

This is a real architectural improvement, not a cosmetic one: it removes
`CareScheduleLastNotifiedForDueAtValueObject`, `findDueForReminder`, and the
`DispatchDueCareRemindersCommand` entirely from the previous revision — the
`care-schedule` domain and schema are untouched by this change (no new
column, no new VO, no new query).

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|------------------------|-----------|
| Detection mechanism | BullMQ delayed job, `jobId = careScheduleId`, `delay = nextDueAt - now` | `@Cron(EVERY_MINUTE)` polling scan (previous revision) | Explicit product decision — precise timing, zero polling, no `lastNotifiedForDueAt` bookkeeping in the domain |
| Reconciliation safety net | **None** | A coarse (15–30 min) fallback cron re-scanning for due-but-unqueued schedules | Explicit product decision to go fully cron-free; accepted risk is a lost/stale reminder on a transient Redis failure at the exact moment a handler runs (see Risks) |
| Cross-context transport | BullMQ queue (`push-notifications`), not `CommandBus.execute()` | Keep the synchronous CommandBus call from the previous revision | Once Redis is available, an async queue gives free retry/backoff on the *delivery* step and decouples `care-schedule`'s handler latency from `notifications`'s (and the push provider's) — a straightforward upgrade once the infra exists |
| Job identity / replace semantics | `jobId = careScheduleId`; `scheduleReminder` always removes any existing job for that id before adding the new one | A separate "cancel" call before every "schedule" call from the handler side | Centralizes replace-safety in one adapter method — callers just say "this is now due at T," never need to reason about whether a previous job exists |
| `notifications` tenant scoping | None — user-scoped only | Space-scoped like most contexts | Unchanged from the previous revision — a push subscription is tied to a browser+user, not a space |
| `SendPushNotificationCommand` transport exposure | **None** via REST/GraphQL/MCP; reachable via `CommandBus` from the new BullMQ processor only | Expose it like every other command | Unchanged rationale from the previous revision — no legitimate client use case for "send an arbitrary push to any userId"; the processor is simply a new, still-internal caller |
| Job payload shape | Plain, duck-typed object (`{ userId, title, body, url }`) — no cross-context TypeScript type import | Import `SendPushNotificationCommand`'s constructor type into `care-schedule`'s adapter | The queue is a message contract between two contexts, conceptually the same as a REST/GraphQL contract — no compile-time coupling needed, only convention. Keeps the "cross-context reach only from infrastructure/adapters" rule trivially true: the adapter needs zero imports from `@contexts/notifications` |
| Queue registration | `push-notifications` queue registered (BullMQ `registerQueue`) in **both** `care-schedule.module.ts` (producer only) and `notifications.module.ts` (producer + `@Processor` consumer) | A single shared queue-registration module | Standard `@nestjs/bullmq` pattern — any module that injects `@InjectQueue(...)` must register that queue name locally; only one module needs to also declare the `@Processor` |
| Redis connection config | One `BullModule.forRootAsync(...)` in `CoreModule`, reading `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` | Per-module Redis config | Same pattern as `TypeOrmModule.forRootAsync` already in `CoreModule` — one global connection config, every `registerQueue` call reuses it |
| Job cleanup | `defaultJobOptions: { removeOnComplete: true, removeOnFail: true }` on the queue | Keep completed/failed jobs around | A recurring schedule reuses the same `careScheduleId` as `jobId` for its next occurrence — the previous job must not linger and block reuse of that id |
| VAPID key transport | `web-push` npm package | AWS SNS, FCM SDK directly, third-party push service | Unchanged from the previous revision |

## `IReminderSchedulerPort` pattern

```typescript
// contexts/care-schedule/application/ports/reminder-scheduler.port.ts
export const REMINDER_SCHEDULER_PORT = Symbol('REMINDER_SCHEDULER_PORT');

export interface IReminderSchedulerPort {
  /**
   * Schedules (or replaces) a delayed reminder for this schedule, firing at
   * `dueAt`. Implemented by an adapter that enqueues into the
   * push-notifications BullMQ queue.
   */
  scheduleReminder(input: ScheduleReminderInput): Promise<void>;

  /** Cancels any pending reminder job for this schedule, if one exists. */
  cancelReminder(careScheduleId: string): Promise<void>;
}

// contexts/care-schedule/application/ports/schedule-reminder.input.ts
export interface ScheduleReminderInput {
  careScheduleId: string;
  userId: string;
  plantId: string;
  activityType: string;
  dueAt: Date;
}
```

```typescript
// contexts/care-schedule/infrastructure/adapters/reminder-queue.adapter.ts
@Injectable()
export class ReminderQueueAdapter implements IReminderSchedulerPort {
  private readonly logger = new Logger(ReminderQueueAdapter.name);

  constructor(
    @InjectQueue('push-notifications') private readonly queue: Queue,
  ) {}

  async scheduleReminder(input: ScheduleReminderInput): Promise<void> {
    const delay = Math.max(0, input.dueAt.getTime() - Date.now());
    await this.cancelReminder(input.careScheduleId); // replace semantics
    await this.queue.add(
      'send',
      {
        userId: input.userId,
        title: 'Time to take care of your plant',
        body: `${input.activityType.toLowerCase()} is due`,
        url: `/plants/${input.plantId}`,
      },
      { jobId: input.careScheduleId, delay },
    );
    this.logger.log(
      `Scheduled reminder for care schedule ${input.careScheduleId} in ${delay}ms`,
    );
  }

  async cancelReminder(careScheduleId: string): Promise<void> {
    const existing = await this.queue.getJob(careScheduleId);
    if (existing) await existing.remove();
  }
}
```

Note: this file needs **zero** imports from `@contexts/notifications` — the
payload is a plain object matching the processor's expected shape by
convention, not by shared type. This is a stronger form of decoupling than
the previous CommandBus-based revision, which required the adapter to
import and construct `SendPushNotificationCommand` directly.

## Where each care-schedule handler calls the port

| Handler | Call | Condition |
|---------|------|-----------|
| `CreateCareScheduleCommandHandler` | `scheduleReminder(...)` | Always, if the created schedule is `active` (the default) |
| `CompleteCareScheduleCommandHandler` | `scheduleReminder(...)` with the **new** `nextDueAt` | If the schedule is still `active` after `complete()` (recurring) |
| `CompleteCareScheduleCommandHandler` | `cancelReminder(...)` | If the schedule became inactive after `complete()` (one-time task, no interval) |
| `UpdateCareScheduleCommandHandler` | `cancelReminder(...)` | `active` toggled `true → false` |
| `UpdateCareScheduleCommandHandler` | `scheduleReminder(...)` with the current `nextDueAt` | `active` toggled `false → true` (if `nextDueAt` is already past, `delay` clamps to 0 — fires almost immediately, correctly "catching up" a reactivated overdue schedule) |
| `DeleteCareScheduleCommandHandler` | `cancelReminder(...)` | Always, before or after removing the aggregate |

Every call is wrapped in `try/catch` (mirrors the existing
`recordCareLogEntry` pattern in `complete-care-schedule.handler.ts` exactly)
— a Redis failure logs a warning/error and does not roll back or fail the
authoritative Postgres write.

## `PushNotificationsProcessor` (notifications, new transport)

```typescript
// contexts/notifications/transport/queues/push-notifications.processor.ts
@Processor('push-notifications')
export class PushNotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(PushNotificationsProcessor.name);

  constructor(private readonly commandBus: CommandBus) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing push job ${job.id} for user ${job.data.userId}`);
    await this.commandBus.execute(
      new SendPushNotificationCommand({
        userId: job.data.userId,
        title: job.data.title,
        body: job.data.body,
        url: job.data.url,
      }),
    );
  }
}
```

This is the one legitimate internal caller of `SendPushNotificationCommand`
besides the command itself being dispatched programmatically — it lives
under `transport/queues/`, a new sibling to `transport/rest/`,
`transport/graphql/`, `transport/mcp/`, all of which this command
deliberately has none of.

## Data Flow

```
CreateCareSchedule / CompleteCareSchedule / UpdateCareSchedule (active) / DeleteCareSchedule
  └─> (best-effort, try/catch) reminderSchedulerPort.scheduleReminder(...) / .cancelReminder(...)
        └─> ReminderQueueAdapter
              └─> queue.getJob(careScheduleId)?.remove()   // replace semantics
              └─> queue.add('send', payload, { jobId: careScheduleId, delay })

... Redis holds the delayed job until `delay` elapses ...

PushNotificationsProcessor (notifications, BullMQ @Processor)
  └─> CommandBus.execute(SendPushNotificationCommand)
        └─> SendPushNotificationHandler
              ├─> pushSubscriptionReadRepository.findByUserId(userId)
              └─> for each subscription (best-effort per subscription):
                    pushSenderPort.send(subscription, payload)
                      └─> WebPushAdapter → web-push library → browser push service
                            on 404/410 → CommandBus.execute(UnregisterPushSubscriptionCommand)
```

Register/unregister flow (REST/GraphQL/MCP, `@SkipSpace()` + `JwtAuthGuard`)
is unchanged from the previous revision.

## File Changes

### `notifications` (new context)

Same file tree as the previous revision (see git history if needed), **plus**:

```
transport/
  queues/push-notifications.processor.ts     # NEW
notifications.module.ts                       # MODIFIED: BullModule.registerQueue + processor provider
```

### `care-schedule` (modified)

```
application/
  ports/reminder-scheduler.port.ts             # NEW (replaces notify-due-care-schedule.port.ts)
  ports/schedule-reminder.input.ts              # NEW
  commands/create-care-schedule/create-care-schedule.handler.ts     # MODIFIED
  commands/complete-care-schedule/complete-care-schedule.handler.ts # MODIFIED
  commands/update-care-schedule/update-care-schedule.handler.ts     # MODIFIED
  commands/delete-care-schedule/delete-care-schedule.handler.ts     # MODIFIED
infrastructure/
  adapters/reminder-queue.adapter.ts            # NEW (replaces notify-due-care-schedule.adapter.ts)
care-schedule.module.ts                         # MODIFIED: BullModule.registerQueue (producer) + adapter binding
```

No domain, entity, mapper, or repository changes in `care-schedule` — this
revision touches only `application/` (4 handlers + 1 port + 1 input type)
and `infrastructure/adapters/` (1 new adapter) plus module wiring.

| File | Action | Description |
|------|--------|--------------|
| `src/database/migrations/1780000000026-CreatePushSubscriptions.ts` | Create | `push_subscriptions` table + unique index on `endpoint` + index on `user_id` |
| `src/core/config/env.validation.ts` | Modify | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT` |
| `src/core/core.module.ts` | Modify | Add `BullModule.forRootAsync(...)` to `CORE_MODULES` |
| `src/app.module.ts` | Modify | Register `NotificationsModule` |
| `docker-compose.yml` | Modify | Add `redis` service (`redis:7-alpine`, port `6379`) |
| `docker-compose.test.yml` | Modify | Add `redis-test` service for integration tests |
| `src/contexts/notifications/README.md` | Create | Context walkthrough incl. the queue-based processor |
| `src/contexts/care-schedule/README.md` | Modify | Document the new port/adapter/queue interaction |

## Interfaces / Contracts

```ts
// domain/repositories/write/push-subscription-write.repository.ts
export const PUSH_SUBSCRIPTION_WRITE_REPOSITORY = Symbol('PUSH_SUBSCRIPTION_WRITE_REPOSITORY');
export interface IPushSubscriptionWriteRepository
  extends IBaseWriteRepository<PushSubscriptionAggregate> {
  findByEndpoint(endpoint: string): Promise<PushSubscriptionAggregate | null>;
  findByUserId(userId: string): Promise<PushSubscriptionAggregate[]>;
}
```

(`care-schedule`'s write repository is unchanged in this revision — no
`findDueForReminder` anymore.)

**`push_subscriptions` entity columns**: unchanged from the previous
revision — `id` (uuid pk), `user_id` (uuid, indexed), `endpoint` (text,
UNIQUE), `p256dh` (varchar 255), `auth` (varchar 255), `user_agent` (varchar
512, NULL), `created_at`, `updated_at`. No `space_id`.

**`RegisterPushSubscriptionCommand` handler**: unchanged — upsert by
`endpoint`.

**`SendPushNotificationCommand` handler**: unchanged — best-effort per
subscription, self-unregisters on `404`/`410`.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `reminder-queue.adapter.spec.ts`: `scheduleReminder` removes an existing job before adding; computes `delay` correctly (including clamping a past `dueAt` to `0`); `cancelReminder` no-ops when no job exists | Jest, mock BullMQ `Queue` (`jest.Mocked<Queue>`) |
| Unit | `create-care-schedule.handler.spec.ts` (extend): calls `scheduleReminder` after a successful create; a `scheduleReminder` failure does not prevent the create from succeeding | Jest |
| Unit | `complete-care-schedule.handler.spec.ts` (extend): recurring completion calls `scheduleReminder` with the new `nextDueAt`; one-time completion calls `cancelReminder` instead | Jest |
| Unit | `update-care-schedule.handler.spec.ts` (extend): `active` `true→false` calls `cancelReminder`; `false→true` calls `scheduleReminder`; no `active` change calls neither | Jest |
| Unit | `delete-care-schedule.handler.spec.ts` (extend): calls `cancelReminder` | Jest |
| Unit | `push-notifications.processor.spec.ts`: `process(job)` dispatches `SendPushNotificationCommand` with the job's data | Jest, mock `CommandBus` |
| Unit | `push-subscription.aggregate.spec.ts`, `register-push-subscription.handler.spec.ts`, `send-push-notification.handler.spec.ts`, `web-push.adapter.spec.ts` | Unchanged from the previous revision |
| Integration | `reminder-queue.adapter.integration-spec.ts`: against a real Redis (docker-compose), a job scheduled with a short delay actually becomes available after that delay; replacing a job by id leaves exactly one job for that id | Real Redis |
| Integration | `push-subscription-typeorm-write.repository.integration-spec.ts` | Unchanged |
| E2E | `push-subscriptions-rest.e2e-spec.ts`, `push-subscriptions-graphql.e2e-spec.ts` | Unchanged |
| E2E | `care-schedule-reminders.e2e-spec.ts` (new): creating a schedule with a `nextDueAt` a few seconds in the future results in a job appearing in the `push-notifications` queue with the right `jobId`/`delay`; completing it early removes/replaces that job | Real Redis + Postgres |
| Static | `notifications-no-cross-context-import.spec.ts` | Unchanged |
| Static | `send-push-notification-not-exposed.spec.ts`: scans `notifications/transport/rest/**`, `transport/graphql/**`, `transport/mcp/**` (explicitly excluding `transport/queues/**`, the processor's legitimate location) for references to `SendPushNotificationCommand` | Jest source scan |
| Static | `care-schedule-no-cross-context-import.spec.ts` (extend): `@contexts/notifications` imports appear only under `care-schedule/infrastructure/adapters/` — note this assertion is now moot in practice since the adapter imports nothing from `@contexts/notifications` at all (see Architecture Decisions), but the test still guards against a future regression that *does* add such an import | Jest source scan |

## Migration / Rollout

One additive migration (`push_subscriptions`), unchanged from the previous
revision. No `care-schedule` schema change in this revision — nothing to
migrate there. `BullModule.forRootAsync(...)` is registered once, globally,
in `CoreModule`; any future context needing a queue registers it locally via
`BullModule.registerQueue(...)`.

**Rollout ordering**: Redis must be reachable (env vars set, service up)
before this deploys — `BullModule.forRootAsync` will fail fast at boot
otherwise, same as the existing Postgres connection does today.

## Open Questions

- **No reconciliation safety net, by explicit decision.** Flagged here again
  (also in proposal.md's Risks) because it is the single biggest behavioural
  difference from a "fully professional" production system: real-world
  systems combining precise delayed jobs typically pair them with a coarse
  periodic reconciliation pass specifically to catch lost enqueues. This
  change deliberately ships without one. If reminder reliability issues
  surface in practice, the cheapest fix is a low-frequency (e.g. every 30
  min) job that queries `active` schedules with `nextDueAt` in the past and
  no corresponding job in the queue (`queue.getJob(id)` returns `undefined`),
  re-enqueueing those — this can be added later without touching anything
  else in this design.
- **Browser support caveat** (frontend concern, unchanged from the previous
  revision): iOS Safari requires the site installed as a Home Screen PWA
  before Web Push works at all.
- **VAPID key rotation**: not addressed in v1, unchanged from the previous
  revision.
