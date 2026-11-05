# Proposal: Care Schedule Push Reminders (`notifications` + `care-schedule`)

> **Revision note**: superseded the original cron-based design. `care-schedule`
> now schedules a **delayed BullMQ job** (Redis-backed) at the exact
> `nextDueAt` instant instead of polling every minute; the job itself is the
> "is it time yet" mechanism, so there is no `@Cron` anywhere in this change.
> Delivery to `notifications` is now asynchronous (a queue), not a
> synchronous `CommandBus.execute()` call, which is also where BullMQ's
> built-in retry/backoff on delivery failures comes from. This trade was
> made **explicitly without a reconciliation safety-net cron** — see Risks.

## Intent

`CareScheduleAggregate.nextDueAt` is already computed and persisted on every
create/complete, but nothing ever surfaces it to the user outside of an
explicit query. A user who does not open Gardenia on the right day has no way
of knowing a plant needs watering today. This change closes that loop: the
moment a care-schedule task becomes due, the owning user gets an **immediate
Web Push notification** on their device — no polling, no daily digest.

## Scope

### In Scope

- **Redis** as new infrastructure (docker-compose service locally; a managed
  instance in every deployed environment) — the first stateful dependency in
  this codebase besides Postgres.
- New **`notifications`** bounded context (not tenant-scoped — a push
  subscription belongs to a user + browser pair, independent of the active
  space):
  - `PushSubscriptionAggregate`: `id`, `userId`, `endpoint` (unique),
    `p256dh` + `auth` keys, `userAgent?`, `createdAt`, `updatedAt`.
  - Commands: `RegisterPushSubscriptionCommand` (upsert by `endpoint`),
    `UnregisterPushSubscriptionCommand`, and `SendPushNotificationCommand`
    (internal-only — no REST/GraphQL/MCP; reachable via `CommandBus` from the
    new BullMQ processor, see below).
  - `WebPushAdapter implements IPushSenderPort` using the `web-push` npm
    package + VAPID keys from env. On a `404`/`410` from the push service
    (subscription gone), the adapter dispatches
    `UnregisterPushSubscriptionCommand` for that subscription to self-heal.
  - **New**: `PushNotificationsProcessor` — a BullMQ `@Processor` consuming
    the `push-notifications` queue, calling
    `CommandBus.execute(new SendPushNotificationCommand(job.data))`. This is
    a new *transport* mechanism for this context (parallel to REST/GraphQL/
    MCP), queue-based instead of request/response.
  - Dual transport (REST + GraphQL) for register/unregister, guarded by
    `JwtAuthGuard` only (`@SkipSpace()` — no `X-Space-ID` required), + their
    MCP tools.
- **`care-schedule`** changes (no new persisted field, no new query — see
  Revision note):
  - New port `IReminderSchedulerPort`
    (`application/ports/reminder-scheduler.port.ts`) with two methods:
    `scheduleReminder(input)` (add/replace a delayed job for a schedule) and
    `cancelReminder(careScheduleId)` (remove a pending job).
  - New `ReminderQueueAdapter implements IReminderSchedulerPort`
    (`infrastructure/adapters/reminder-queue.adapter.ts`) — the sole file
    allowed to talk to the `push-notifications` BullMQ queue on the producer
    side; builds the push payload and calls `queue.add('send', payload, {
    jobId: careScheduleId, delay })` (delay = `nextDueAt - now`, clamped to 0).
  - `CreateCareScheduleCommandHandler`, `CompleteCareScheduleCommandHandler`,
    `UpdateCareScheduleCommandHandler` (on `active` toggling), and
    `DeleteCareScheduleCommandHandler` are each extended with a best-effort
    call to `scheduleReminder`/`cancelReminder` — see design.md for exactly
    which handler calls which method and why.
- New dependencies: `@nestjs/bullmq` + `bullmq` (replacing the previously
  proposed `@nestjs/schedule`), `web-push` + `@types/web-push`.
- New env vars: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (or a single
  `REDIS_URL`), `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`,
  `WEB_PUSH_VAPID_SUBJECT` — all validated in `env.validation.ts`.
- One migration: `push_subscriptions` table only.

### Out of Scope

- Email or any other channel — `IPushSenderPort` is channel-agnostic so a
  future `EmailSenderPort` can be added without touching `care-schedule`.
- Per-user notification preferences, quiet hours, or opt-out granularity
  beyond "has at least one active subscription or not."
- Wiring any other event type through this pipe (low-stock inventory, space
  invitations) — `notifications` is generic by construction but this change
  wires only `care-schedule`.
- **A reconciliation safety-net job.** Explicitly rejected in this revision:
  if `queue.add()`/`getJob()`/`.remove()` fails at the exact moment a
  care-schedule command handler runs (a transient Redis blip), that
  schedule's reminder is silently lost or stale with nothing to detect or
  retry it later — there is no periodic scan to catch it. This is a
  conscious trade for zero polling; see Risks.
- Multi-instance coordination beyond what BullMQ already provides. BullMQ's
  own atomic Redis operations make the producer/consumer side safe across
  multiple API replicas out of the box — this is actually an improvement
  over the previous cron-based design, not a new risk.
- gardenia-web's service worker + opt-in UI — tracked as a separate,
  dependent change in that repo (`care-schedule-push-reminders-web`).
- Retry/backoff *policy tuning* beyond BullMQ's defaults for the delivery
  step (attempts/backoff strategy) — use sane defaults (e.g. 3 attempts,
  exponential backoff), revisit if real delivery failure rates warrant it.

## Capabilities

### New Capabilities

- `notifications`: register/unregister a browser push subscription for the
  current user; consume queued push jobs and deliver them to all of a user's
  active subscriptions (internal capability, not user-triggerable).

### Modified Capabilities

- `care-schedule`: schedule mutations (create, complete, activate/deactivate,
  delete) now manage a corresponding delayed reminder job so a push fires
  exactly when the task becomes due — no polling.

## Approach

- **Cross-context boundary respected, transport swapped from sync to async**:
  `care-schedule` never imports `@contexts/notifications/domain` or
  `application` outside its own
  `infrastructure/adapters/reminder-queue.adapter.ts` — the same seam as
  before, just the adapter talks to a BullMQ `Queue` client instead of
  `CommandBus.execute()`. The job payload is a plain, duck-typed object (no
  cross-context type import needed) — the queue is effectively a durable,
  delayed message contract between the two contexts.
- **Detection = the job's delay, not a scan**: there is no
  `lastNotifiedForDueAt` field and no `findDueForReminder` query anymore —
  removed from this revision. The BullMQ job, keyed by `jobId =
  careScheduleId` with `delay = nextDueAt - now`, is the entire "is it due
  yet" mechanism. A schedule can have at most one pending job at a time;
  `scheduleReminder` always removes any existing job for that id before
  adding the new one (handles reschedule-on-complete cleanly).
- **Not tenant-scoped**: `notifications` has no `spaceId`. Register/
  unregister use `@SkipSpace() @UseGuards(JwtAuthGuard)`, the same pattern
  `POST /api/spaces` already uses for its own non-tenant-scoped mutation.
- **Upsert on register**: `endpoint` is globally unique. Registering an
  endpoint that already exists updates `userId`/keys instead of erroring.
- **Best-effort job scheduling, not transactional**: each care-schedule
  handler wraps its `scheduleReminder`/`cancelReminder` call in `try/catch`
  (mirrors the existing pattern around `careLogPort.recordCareLogEntry` in
  `complete-care-schedule.handler.ts`) — a Redis failure must not roll back
  the (authoritative) Postgres write.
- **Delivery retry is now real**: BullMQ retries `PushNotificationsProcessor`
  job failures per its configured attempts/backoff, unlike the previous
  design's single-attempt-per-cron-tick delivery.

## Affected Areas

| Area | Impact | Description |
|------|--------|--------------|
| `src/contexts/notifications/` | New | Full bounded context, incl. BullMQ processor |
| `src/contexts/care-schedule/application/ports/reminder-scheduler.port.ts` | New | Port interface |
| `src/contexts/care-schedule/application/ports/schedule-reminder.input.ts` | New | Input type |
| `src/contexts/care-schedule/infrastructure/adapters/reminder-queue.adapter.ts` | New | Adapter (BullMQ producer) |
| `src/contexts/care-schedule/application/commands/create-care-schedule/create-care-schedule.handler.ts` | Modified | + `scheduleReminder` call |
| `src/contexts/care-schedule/application/commands/complete-care-schedule/complete-care-schedule.handler.ts` | Modified | + `scheduleReminder`/`cancelReminder` call |
| `src/contexts/care-schedule/application/commands/update-care-schedule/update-care-schedule.handler.ts` | Modified | + `scheduleReminder`/`cancelReminder` on `active` toggle |
| `src/contexts/care-schedule/application/commands/delete-care-schedule/delete-care-schedule.handler.ts` | Modified | + `cancelReminder` call |
| `src/contexts/care-schedule/care-schedule.module.ts` | Modified | Register `push-notifications` queue (producer) + adapter |
| `src/database/migrations/1780000000026-CreatePushSubscriptions.ts` | New | `push_subscriptions` table |
| `src/core/config/env.validation.ts` | Modified | Redis + VAPID env vars |
| `src/core/core.module.ts` | Modified | `BullModule.forRootAsync(...)` (Redis connection) |
| `src/app.module.ts` | Modified | Register `NotificationsModule` |
| `docker-compose.yml`, `docker-compose.test.yml` | Modified | Add `redis` service |
| `package.json` | Modified | `@nestjs/bullmq`, `bullmq`, `web-push`, `@types/web-push` |
| `src/core/health/` | Modified (optional) | Add Redis ping to the health check |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| A `scheduleReminder`/`cancelReminder` call fails transiently (Redis blip) → reminder silently lost or stale, with **no reconciliation job to catch it** | Low-Med | Explicitly accepted for this revision, per product decision to go cron-free. Logged loudly (`logger.error`) on failure so it is at least visible in monitoring/alerting, even though nothing auto-retries it |
| Redis becomes a hard dependency for reminders (previously care-schedule had none) | Med | Redis down → `scheduleReminder`/`cancelReminder` calls fail and are swallowed by the best-effort `try/catch` (schedule CRUD itself keeps working; only reminders are affected) |
| Recurring schedule completed **early** (before its own pending job fires) leaves a stale job for the old due date if not replaced | Low | `scheduleReminder` always removes the existing `jobId` before adding the new one — the completion handler calls it unconditionally when still active, so the stale job for the old occurrence never fires |
| Expired/invalid push subscription (uninstalled browser, revoked permission) | Med | `WebPushAdapter` catches `410`/`404` and self-unregisters via `UnregisterPushSubscriptionCommand` |
| VAPID keys / Redis connection missing/misconfigured in an environment | Low | `env.validation.ts` fails fast at boot |
| `SendPushNotificationCommand` reachable without a REST/GraphQL/MCP entry point could be mistaken for dead code by a future maintainer | Low | Documented in design.md + context README; a static test asserts no controller/resolver/MCP tool references it (the BullMQ processor is the one legitimate internal caller) |

## Rollback Plan

The migration is additive (`down()` drops `push_subscriptions`) with no data
migration elsewhere. Revert the branch; run the migration's `down()`. The
queue/adapter/processor wiring is a pure addition to `care-schedule`'s
existing handlers — reverting restores current behaviour (schedules keep
working, they simply stop producing reminder jobs) with zero impact on other
contexts. Redis itself can stay provisioned but unused if this is ever
rolled back — it is not a destructive dependency to remove either, once no
code references it.

## Dependencies

- `@nestjs/bullmq` + `bullmq` (new) — requires a reachable Redis instance in
  every environment.
- `web-push` + `@types/web-push` (new).
- Reuses `JwtAuthGuard`, `@SkipSpace()`, `BaseAggregate`/`BaseBuilder`,
  `UuidValueObject`/`StringValueObject` from `@sisques-labs/nestjs-kit`.

## Success Criteria

- [ ] A care-schedule task becoming due triggers a push notification to the
      owning user's registered devices within seconds of `nextDueAt` (not
      "up to a minute late" — this is the main improvement over the
      cron-based revision).
- [ ] Completing, deactivating, reactivating, or deleting a schedule
      correctly replaces or cancels its pending reminder job — no duplicate
      and no stale reminder fires.
- [ ] Register/unregister endpoints work via REST, GraphQL, and MCP, guarded
      by `JwtAuthGuard` only (no space required).
- [ ] `SendPushNotificationCommand` has zero REST/GraphQL/MCP entry points —
      verified by a static source-scan test; the BullMQ processor is its only
      caller.
- [ ] An expired push subscription is automatically removed on next delivery
      attempt.
- [ ] No `@contexts/notifications` import in `care-schedule` outside
      `infrastructure/adapters/reminder-queue.adapter.ts`.
- [ ] Unit, integration, and e2e tests green; coverage ≥ 80%.
