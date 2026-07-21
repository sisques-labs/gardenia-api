# Design: Care Schedule Push Reminders (`notifications` + `care-schedule`)

## Technical Approach

Two coordinated pieces:

1. **`notifications`** — a small, standalone bounded context whose only job
   is "remember a user's push subscriptions, and send a push to all of
   them." It has no idea `care-schedule` exists.
2. **`care-schedule`** — gains the business rule "a due, not-yet-notified,
   active schedule should trigger a reminder", expressed as a `@Cron` job
   that walks due schedules and calls out through a port. It has no idea
   *how* the reminder is delivered (push today, maybe email tomorrow).

The two are connected exclusively through `CommandBus.execute()`, wrapped by
a port/adapter pair — the same anti-corruption seam `weather`↔`spaces` and
`care-log`↔`care-schedule` already use in this codebase.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|------------------------|-----------|
| Channel for v1 | Web Push (VAPID) | Email | Explicit product decision — immediate, no inbox lag, works with the browser permission model already native to PWAs |
| Cadence | Immediate (per-task, driven by a 1-minute cron) | Daily digest | Explicit product decision — favors "act now" over batching |
| `notifications` tenant scoping | None — user-scoped only | Space-scoped like most contexts | A push subscription is tied to a browser+user, not to which space happens to be active; forcing `spaceId` would require re-registering per space for no benefit |
| Cross-context call | `INotifyDueCareSchedulePort` (care-schedule/application/ports) + `NotifyDueCareScheduleAdapter` (care-schedule/infrastructure/adapters) dispatching `SendPushNotificationCommand` via `CommandBus` | Direct import of `notifications` application/domain from `care-schedule` | Mandatory pattern per `openspec/config.yaml` rule 66 and the `harden-context-boundaries` ESLint rule — cross-context reads/writes only from the consumer's own `infrastructure/adapters/` |
| `SendPushNotificationCommand` transport exposure | **None** — no REST/GraphQL/MCP tool; reachable only via internal `CommandBus.execute()` | Expose it like every other command (repo's default MCP-tool rule) | A user-triggerable "send an arbitrary push to any userId" endpoint is a real abuse vector (harassment, spam) with no legitimate product use case. The architecture skill already carves out a precedent exception for `auth` (credential/session/PII-sensitive contexts don't get blanket MCP exposure) — this is the same kind of explicit, documented exception, not an oversight |
| Reminder de-duplication | New VO `lastNotifiedForDueAt` on `CareScheduleAggregate`, compared against `nextDueAt` | A separate "already notified" ledger/log table in `notifications` | Keeps the business rule ("don't remind twice for the same due date") inside the domain that owns the due-date concept (`care-schedule`), not leaked into the generic delivery mechanism. Mirrors how `lastCompletedAt`/`nextDueAt` already live on this aggregate |
| Endpoint uniqueness | `endpoint` UNIQUE, register = upsert | Reject duplicate `endpoint` with a conflict error | A browser subscription endpoint is a stable identifier across logins/devices; upserting handles re-login and shared-device flows without extra client logic |
| Delivery failure handling | Best-effort per subscription; catch `410`/`404` → self-unregister; other errors logged, not retried | Retry queue / dead-letter | Out of scope for v1 (explicit); matches the existing `try/catch`-and-log pattern around `careLogPort.recordCareLogEntry` |
| Scheduler | `@nestjs/schedule` `@Cron(CronExpression.EVERY_MINUTE)`, single instance | A dedicated worker process / distributed lock | First scheduler in the codebase; production is single-instance today. Documented as a risk to revisit before horizontal scaling |
| `findDueForReminder` query | Dedicated method on `ICareScheduleWriteRepository`, built with TypeORM `QueryBuilder`, NOT the mandatory `findByCriteria`/Criteria-pattern machinery | Add it as a `CareScheduleFindByCriteria` filter | The Criteria/`FilterFieldRegistry` pattern in `openspec/config.yaml` rule 58 is mandatory specifically for **`{context}sFindByCriteria` GraphQL/REST-facing queries** (client-choosable filters). This is an internal, fixed-shape query with no client input and no transport exposure — same category as `AssertCareScheduleExistsService`'s `findById` call, not a public find-by-criteria endpoint |
| VAPID key transport | `web-push` npm package | AWS SNS, FCM SDK directly, OneSignal/third-party service | `web-push` talks to whichever push service the browser vendor uses (FCM, Mozilla autopush, etc.) using the standard Web Push protocol with only a VAPID key pair — zero third-party account/API-key dependency, matching the codebase's existing preference for direct external APIs (Open-Meteo has no key either) |

## `IPushSenderPort` / `INotifyDueCareSchedulePort` pattern

```typescript
// contexts/notifications/application/ports/push-sender.port.ts
export const PUSH_SENDER_PORT = Symbol('PUSH_SENDER_PORT');

export interface IPushSenderPort {
  send(subscription: PushSubscriptionAggregate, payload: PushPayload): Promise<void>;
}

// contexts/notifications/application/ports/push-payload.interface.ts
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}
```

```typescript
// contexts/care-schedule/application/ports/notify-due-care-schedule.port.ts
export const NOTIFY_DUE_CARE_SCHEDULE_PORT = Symbol('NOTIFY_DUE_CARE_SCHEDULE_PORT');

export interface INotifyDueCareSchedulePort {
  /**
   * Notifies the schedule's owner that it is due. Implemented by an adapter
   * that translates to the notifications context via the Command bus.
   */
  notifyDue(input: NotifyDueCareScheduleInput): Promise<void>;
}

// contexts/care-schedule/application/ports/notify-due-care-schedule.input.ts
export interface NotifyDueCareScheduleInput {
  userId: string;
  careScheduleId: string;
  plantId: string;
  activityType: string;
}
```

`NotifyDueCareScheduleAdapter` (infrastructure/adapters/, mirrors
`CareLogAdapter` exactly) builds a human-readable title/body from the input
and dispatches:

```typescript
await this.commandBus.execute(
  new SendPushNotificationCommand({
    userId: input.userId,
    title: 'Time to take care of your plant',
    body: `${input.activityType.toLowerCase()} is due`,
    url: `/plants/${input.plantId}`,
  }),
);
```

Note the adapter file (and only this file) is allowed to import
`@contexts/notifications/application/commands/send-push-notification/send-push-notification.command` —
this is the one exception carved out by the "reaching another context is
allowed exclusively from `infrastructure/adapters/`" rule.

## Data Flow

```
Every 1 min:
DueCareRemindersScheduler (@Cron)
  └─> CommandBus.execute(DispatchDueCareRemindersCommand)
        └─> DispatchDueCareRemindersHandler
              ├─> careScheduleWriteRepository.findDueForReminder(now)
              │     WHERE active = true AND next_due_at <= now
              │       AND (last_notified_for_due_at IS NULL
              │            OR last_notified_for_due_at < next_due_at)
              └─> for each due schedule (best-effort, one failure ≠ abort loop):
                    ├─> notifyDueCareSchedulePort.notifyDue({...})
                    │     └─> NotifyDueCareScheduleAdapter
                    │           └─> CommandBus.execute(SendPushNotificationCommand)
                    │                 └─> SendPushNotificationHandler (notifications)
                    │                       ├─> pushSubscriptionReadRepository.findByUserId(userId)
                    │                       └─> for each subscription:
                    │                             pushSenderPort.send(subscription, payload)
                    │                               └─> WebPushAdapter → web-push library → browser push service
                    │                                     on 404/410 → CommandBus.execute(UnregisterPushSubscriptionCommand)
                    ├─> schedule.markReminderSent(schedule.nextDueAt.value)
                    └─> careScheduleWriteRepository.save(schedule)
```

Register/unregister flow (REST/GraphQL/MCP, `@SkipSpace()` + `JwtAuthGuard`):

```
POST /push-subscriptions  (@CurrentUser → userId)
  └─> CommandBus.execute(RegisterPushSubscriptionCommand)
        └─> upsert by endpoint: update userId/keys if exists, else create
```

## File Changes

### `notifications` (new context, ≈32 files)

```
domain/
  aggregates/push-subscription.aggregate.ts
  builders/push-subscription.builder.ts
  events/push-subscription-registered/push-subscription-registered.event.ts
  events/push-subscription-unregistered/push-subscription-unregistered.event.ts
  events/interfaces/push-subscription-event-data.interface.ts
  exceptions/push-subscription-not-found.exception.ts        # 404
  interfaces/push-subscription.interface.ts
  primitives/push-subscription.primitives.ts
  repositories/read/push-subscription-read.repository.ts     # + findByUserId(userId)
  repositories/write/push-subscription-write.repository.ts   # + findByEndpoint(endpoint)
  value-objects/push-subscription-id/push-subscription-id.value-object.ts
  value-objects/push-subscription-endpoint/push-subscription-endpoint.value-object.ts
  value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object.ts
  value-objects/push-subscription-auth/push-subscription-auth.value-object.ts
  view-models/push-subscription.view-model.ts
application/
  commands/register-push-subscription/register-push-subscription.command.ts
  commands/register-push-subscription/register-push-subscription.handler.ts
  commands/unregister-push-subscription/unregister-push-subscription.command.ts
  commands/unregister-push-subscription/unregister-push-subscription.handler.ts
  commands/send-push-notification/send-push-notification.command.ts
  commands/send-push-notification/send-push-notification.handler.ts
  ports/push-sender.port.ts
  ports/push-payload.interface.ts
infrastructure/
  persistence/typeorm/entities/push-subscription.entity.ts
  persistence/typeorm/mappers/push-subscription-typeorm.mapper.ts
  persistence/typeorm/repositories/push-subscription-typeorm-write.repository.ts
  persistence/typeorm/repositories/push-subscription-typeorm-read.repository.ts
  adapters/web-push.adapter.ts
transport/
  rest/dtos/register-push-subscription.dto.ts
  rest/dtos/push-subscription-rest-response.dto.ts
  rest/controllers/push-subscriptions.controller.ts
  graphql/dtos/requests/register-push-subscription-graphql.dto.ts
  graphql/dtos/responses/push-subscription.response.dto.ts
  graphql/resolvers/push-subscription-mutations.resolver.ts
  graphql/mappers/push-subscription.mapper.ts
  mcp/schemas/push-subscription-register.schema.ts
  mcp/schemas/push-subscription-unregister.schema.ts
  mcp/tools/push-subscription-register.tool.ts
  mcp/tools/push-subscription-unregister.tool.ts
notifications.module.ts
README.md
```

Note: no `update-push-subscription` — a subscription is immutable once
registered (re-registering the same endpoint is the upsert path). No public
`find` query — the only reader is `SendPushNotificationHandler` internally
via the write repository's own lookup, so no read-side transport is needed
in v1.

### `care-schedule` (modified, ≈10 files)

```
domain/
  value-objects/care-schedule-last-notified-for-due-at/care-schedule-last-notified-for-due-at.value-object.ts   # New
  aggregates/care-schedule.aggregate.ts                # Modified: + markReminderSent()
  interfaces/care-schedule.interface.ts                # Modified: + lastNotifiedForDueAt
  primitives/care-schedule.primitives.ts                # Modified: + lastNotifiedForDueAt
  builders/care-schedule.builder.ts                     # Modified: + withLastNotifiedForDueAt
  repositories/write/care-schedule-write.repository.ts  # Modified: + findDueForReminder(now)
application/
  ports/notify-due-care-schedule.port.ts                # New
  ports/notify-due-care-schedule.input.ts                # New
  commands/dispatch-due-care-reminders/dispatch-due-care-reminders.command.ts   # New
  commands/dispatch-due-care-reminders/dispatch-due-care-reminders.handler.ts   # New
infrastructure/
  adapters/notify-due-care-schedule.adapter.ts           # New
  schedulers/due-care-reminders.scheduler.ts             # New
  persistence/typeorm/entities/care-schedule.entity.ts   # Modified: + last_notified_for_due_at
  persistence/typeorm/mappers/care-schedule-typeorm.mapper.ts   # Modified
  persistence/typeorm/repositories/care-schedule-typeorm-write.repository.ts   # Modified: findDueForReminder impl
care-schedule.module.ts                                  # Modified: wire new provider + adapter
```

| File | Action | Description |
|------|--------|-------------|
| `src/database/migrations/1780000000026-CreatePushSubscriptions.ts` | Create | `push_subscriptions` table + unique index on `endpoint` + index on `user_id` |
| `src/database/migrations/1780000000027-AddLastNotifiedForDueAtToCareSchedules.ts` | Create | Nullable `last_notified_for_due_at` timestamptz column on `care_schedules` |
| `src/core/config/env.validation.ts` | Modify | `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT` (required, non-empty) |
| `src/core/core.module.ts` | Modify | Add `ScheduleModule.forRoot()` to `CORE_MODULES` |
| `src/app.module.ts` | Modify | Register `NotificationsModule` |
| `src/contexts/notifications/README.md` | Create | Context walkthrough (auth README as template) |
| `src/contexts/care-schedule/README.md` | Modify | Document the new port/adapter/cron |

## Interfaces / Contracts

```ts
// domain/repositories/write/push-subscription-write.repository.ts
export const PUSH_SUBSCRIPTION_WRITE_REPOSITORY = Symbol('PUSH_SUBSCRIPTION_WRITE_REPOSITORY');
export interface IPushSubscriptionWriteRepository
  extends IBaseWriteRepository<PushSubscriptionAggregate> {
  findByEndpoint(endpoint: string): Promise<PushSubscriptionAggregate | null>;
  findByUserId(userId: string): Promise<PushSubscriptionAggregate[]>;
}

// domain/repositories/write/care-schedule-write.repository.ts (extended)
export interface ICareScheduleWriteRepository
  extends IBaseWriteRepository<CareScheduleAggregate> {
  findDueForReminder(now: Date): Promise<CareScheduleAggregate[]>;
}
```

**`push_subscriptions` entity columns**: `id` (uuid pk), `user_id` (uuid,
indexed, NOT NULL), `endpoint` (text, UNIQUE, NOT NULL), `p256dh` (varchar
255, NOT NULL), `auth` (varchar 255, NOT NULL), `user_agent` (varchar 512,
NULL), `created_at`, `updated_at`. No `space_id` — deliberately not
tenant-scoped.

**`care_schedules` column addition**: `last_notified_for_due_at` (timestamptz,
NULL).

**`CareScheduleAggregate.markReminderSent(notifiedAt: Date)`**: sets
`_lastNotifiedForDueAt = new CareScheduleLastNotifiedForDueAtValueObject(notifiedAt)`,
calls `touch()`. Does NOT emit a domain event — this is bookkeeping state, not
a business-meaningful transition (mirrors `SpaceAggregate.setGeolocation()`'s
precedent of a plain mutator with no event when the change is purely
technical bookkeeping, not a user-facing fact).

**`RegisterPushSubscriptionCommand` handler**: looks up by `endpoint` via
`findByEndpoint`; if found, updates `userId`/`p256dh`/`auth`/`userAgent` and
saves (no `PushSubscriptionRegistered` re-emit on update path — only on
create); if not found, builds + saves + emits
`PushSubscriptionRegisteredEvent`.

**`SendPushNotificationCommand` handler**: `findByUserId(userId)` — if empty,
no-op (user has no subscriptions, not an error); otherwise iterate and call
`pushSenderPort.send()` per subscription inside a `try/catch`, logging and
continuing on failure; on an error carrying `statusCode` 404 or 410, dispatch
`UnregisterPushSubscriptionCommand({ id: subscription.id.value })` via
`CommandBus` before continuing the loop.

**`DispatchDueCareRemindersCommand` handler**: no input fields (parameterless
command triggered purely by the cron). For each due schedule, wrap the
`notifyDueCareSchedulePort.notifyDue()` call in `try/catch` (mirrors
`complete-care-schedule.handler.ts`'s `recordCareLogEntry` pattern exactly) —
a notification failure must not stop `markReminderSent()`/`save()` for that
schedule (otherwise a permanently-undeliverable schedule would retry every
minute forever) nor abort the loop over the remaining due schedules.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `push-subscription.aggregate.spec.ts`: `create()`/`delete()` events; VO validation (`endpoint`/`p256dh`/`auth` non-empty) | Jest |
| Unit | `register-push-subscription.handler.spec.ts`: create path emits event; existing-endpoint path updates without re-emitting create event | Jest, `jest.Mocked<T>` |
| Unit | `send-push-notification.handler.spec.ts`: no subscriptions → no-op; multiple subscriptions → all attempted even if one throws; 410 response → dispatches unregister | Jest |
| Unit | `web-push.adapter.spec.ts`: maps `web-push` library errors' `statusCode` correctly; happy path calls `webpush.sendNotification` with VAPID details | Jest, mock `web-push` module |
| Unit | `care-schedule.aggregate.spec.ts` (extended): `markReminderSent()` sets the VO and does not emit an event | Jest |
| Unit | `dispatch-due-care-reminders.handler.spec.ts`: notifies each due schedule and marks it; one schedule's notify failure does not prevent the next schedule from being processed or from being marked | Jest |
| Unit | `care-schedule-last-notified-for-due-at.value-object.spec.ts`: wraps a `Date`, nullable usage | Jest |
| Integration | `push-subscription-typeorm-write.repository.integration-spec.ts`: `findByEndpoint` round-trip; unique constraint on `endpoint`; `findByUserId` scoping | Test DB |
| Integration | `care-schedule-typeorm-write.repository.integration-spec.ts` (extended): `findDueForReminder` returns only active + due + not-yet-notified schedules; excludes future `nextDueAt`; excludes already-notified-for-this-due-date | Test DB |
| E2E | `push-subscriptions-rest.e2e-spec.ts`: register/unregister behind `JwtAuthGuard` only (no `X-Space-ID` needed); re-registering same endpoint upserts | supertest |
| E2E | `push-subscriptions-graphql.e2e-spec.ts`: same via GraphQL | supertest |
| Static | `notifications-no-cross-context-import.spec.ts`: no import from any other `@contexts/` | Jest source scan |
| Static | `send-push-notification-not-exposed.spec.ts`: scans `notifications/transport/**` (REST controllers, GraphQL resolvers, MCP tools) and asserts none reference `SendPushNotificationCommand` | Jest source scan |
| Static | `care-schedule-no-cross-context-import.spec.ts` (existing, extended if needed): confirms `@contexts/notifications` appears only under `care-schedule/infrastructure/adapters/` | Jest source scan |

## Migration / Rollout

Two additive migrations, applied in order
(`1780000000026` before `1780000000027`, though they touch different tables
and have no ordering dependency between each other). Both `down()` methods
fully revert (drop table / drop column). No backfill needed —
`last_notified_for_due_at` defaults to `NULL`, meaning every existing active
overdue schedule becomes immediately eligible for a reminder the first time
the cron runs after deploy. This is the desired behavior (nothing was ever
notified before this change existed).

`ScheduleModule.forRoot()` is registered once, globally, in `CoreModule` —
any future context needing a `@Cron` job does not need to re-register it.

## Open Questions

- **Browser support caveat** (not blocking this backend change, flagged for
  the web-side proposal): Web Push requires a registered Service Worker and
  is unsupported or restricted on some browser/OS combinations (notably iOS
  Safari requires the site to be installed as a Home Screen PWA before push
  works at all). This is purely a frontend concern and does not affect this
  change's API contract.
- **VAPID key rotation**: not addressed in v1 — rotating the key pair would
  invalidate all existing subscriptions (every browser would need to
  re-subscribe). Acceptable for a first version; flagged as future work if
  key rotation becomes necessary.
