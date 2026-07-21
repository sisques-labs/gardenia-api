# Proposal: Care Schedule Push Reminders (`notifications` + `care-schedule`)

## Intent

`CareScheduleAggregate.nextDueAt` is already computed and persisted on every
create/complete, but nothing ever surfaces it to the user outside of an
explicit query. A user who does not open Gardenia on the right day has no way
of knowing a plant needs watering today. This change closes that loop: the
moment a care-schedule task becomes due, the owning user gets an **immediate
Web Push notification** on their device — no daily digest, no polling by the
user.

## Scope

### In Scope

- New **`notifications`** bounded context (not tenant-scoped — a push
  subscription belongs to a user + browser pair, independent of the active
  space):
  - `PushSubscriptionAggregate`: `id`, `userId`, `endpoint` (unique),
    `p256dh` + `auth` keys, `userAgent?`, `createdAt`, `updatedAt`.
  - Commands: `RegisterPushSubscriptionCommand` (upsert by `endpoint`),
    `UnregisterPushSubscriptionCommand`, and `SendPushNotificationCommand`
    (internal-only — see "Not exposed" below).
  - `WebPushAdapter implements IPushSenderPort` using the `web-push` npm
    package + VAPID keys from env. On a `404`/`410` from the push service
    (subscription gone), the adapter dispatches
    `UnregisterPushSubscriptionCommand` for that subscription to self-heal.
  - Dual transport (REST + GraphQL) for register/unregister, guarded by
    `JwtAuthGuard` only (`@SkipSpace()` — no `X-Space-ID` required), + their
    MCP tools.
  - `SendPushNotificationCommand` is **NOT** exposed via REST, GraphQL, or MCP
    — it is reachable only via internal `CommandBus.execute()` from another
    context's adapter. There is no legitimate reason for a client to trigger
    an arbitrary push to a user, so it simply has no transport entry point
    (see design.md's Architecture Decisions for the reasoning against the
    repo's usual "every command gets an MCP tool" rule).
- **`care-schedule`** changes:
  - New nullable VO `CareScheduleLastNotifiedForDueAtValueObject` on the
    aggregate + instance method `markReminderSent(notifiedAt: Date)`.
  - New port `INotifyDueCareSchedulePort`
    (`application/ports/notify-due-care-schedule.port.ts`) +
    `NotifyDueCareScheduleAdapter`
    (`infrastructure/adapters/notify-due-care-schedule.adapter.ts`) that
    translates to `notifications` via `CommandBus.execute(new
    SendPushNotificationCommand(...))` — mirrors the existing
    `ICareLogPort`/`CareLogAdapter` pattern in this same context.
  - New `DispatchDueCareRemindersCommand` + handler: loads schedules where
    `active = true AND nextDueAt <= now AND (lastNotifiedForDueAt IS NULL OR
    lastNotifiedForDueAt < nextDueAt)` via a new
    `findDueForReminder(now: Date)` method on the write repository, notifies
    each via the port (best-effort, one failure must not block the rest),
    and calls `markReminderSent()` + saves.
  - New `@Injectable()` cron service (`infrastructure/schedulers/`) using
    `@nestjs/schedule`'s `@Cron(CronExpression.EVERY_MINUTE)` that dispatches
    `DispatchDueCareRemindersCommand`.
- New dependency `@nestjs/schedule` (first scheduler in this codebase),
  registered once via `ScheduleModule.forRoot()` in `CoreModule`.
- New dependency `web-push` (+ `@types/web-push` dev dependency).
- New env vars: `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`,
  `WEB_PUSH_VAPID_SUBJECT` (a `mailto:` or `https:` contact URI required by
  the Web Push protocol), validated in `env.validation.ts`.
- Two additive migrations: `push_subscriptions` table;
  `care_schedules.last_notified_for_due_at` nullable column.

### Out of Scope

- Email or any other channel — `IPushSenderPort` is channel-agnostic so a
  future `EmailSenderPort` can be added without touching `care-schedule`.
- Per-user notification preferences, quiet hours, or opt-out granularity
  beyond "has at least one active subscription or not."
- Wiring any other event type through this pipe (low-stock inventory, space
  invitations) — `notifications` is generic by construction but this change
  wires only `care-schedule`.
- Multi-instance / distributed cron locking. Production runs a single API
  instance today; a naive `@Cron` is safe. If the deployment ever scales to
  multiple replicas, the cron will fire on each one and send duplicate
  notifications — flagged under Risks, not solved here.
- gardenia-web's service worker + opt-in UI — tracked as a separate,
  dependent change in that repo (`care-schedule-push-reminders-web`) so this
  backend change can ship and be verified independently (curl/Postman/MCP)
  before the frontend lands.
- Retry/backoff queue for failed push deliveries — a failed send is logged
  and skipped; the next cron tick (task is still due, `lastNotifiedForDueAt`
  was already advanced) will NOT retry it, since we mark the reminder sent
  regardless of individual subscription delivery outcome (see design.md).

## Capabilities

### New Capabilities

- `notifications`: register/unregister a browser push subscription for the
  current user; deliver a push notification to all of a user's active
  subscriptions (internal capability, not user-triggerable).

### Modified Capabilities

- `care-schedule`: schedules now track whether a reminder was already sent
  for the current due occurrence, and a background job dispatches due
  reminders every minute.

## Approach

- **Cross-context boundary respected**: `care-schedule` never imports
  `@contexts/notifications/domain` or `application` outside its own
  `infrastructure/adapters/notify-due-care-schedule.adapter.ts` — exactly the
  seam the `harden-context-boundaries` change locked in with an ESLint rule.
  The port interface in `care-schedule/application/ports/` uses only
  primitive types (no `notifications` types leak into `care-schedule`'s
  application layer).
- **`lastNotifiedForDueAt` semantics**: a schedule is "reminder-pending" when
  `lastNotifiedForDueAt IS NULL OR lastNotifiedForDueAt < nextDueAt`. Sending
  a reminder sets `lastNotifiedForDueAt = nextDueAt` (the due timestamp the
  reminder was for, not "now") so that a schedule which becomes due again
  later (after `complete()` recalculates `nextDueAt`) is eligible for a new
  reminder without any extra bookkeeping.
- **Not tenant-scoped**: `notifications` has no `spaceId` — a user's push
  subscription is independent of which space is active when they registered
  it. `RegisterPushSubscriptionCommand`/`UnregisterPushSubscriptionCommand`
  use `@SkipSpace() @UseGuards(JwtAuthGuard)`, the same pattern `POST
  /api/spaces` already uses for its own non-tenant-scoped mutation.
- **Upsert on register**: `endpoint` is globally unique (one physical
  browser+origin registration). Registering an endpoint that already exists
  updates `userId`/keys instead of erroring — covers re-login and shared
  devices cleanly.
- **Best-effort delivery, not transactional**: `SendPushNotificationCommand`'s
  handler iterates every subscription for the `userId` and sends
  independently; one subscription's failure (expired, network error) must not
  prevent delivery to the user's other devices, and must not fail the
  care-schedule reminder dispatch that triggered it (mirrors the existing
  `try/catch` around `careLogPort.recordCareLogEntry` in
  `complete-care-schedule.handler.ts`).
- **Single-instance cron**: `@nestjs/schedule`'s in-process `@Cron` is
  sufficient at current scale (one API replica). No Postgres advisory lock
  in this change.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/contexts/notifications/` | New | Full bounded context |
| `src/contexts/care-schedule/domain/value-objects/care-schedule-last-notified-for-due-at/` | New | New VO |
| `src/contexts/care-schedule/domain/aggregates/care-schedule.aggregate.ts` | Modified | `markReminderSent()` method |
| `src/contexts/care-schedule/application/ports/notify-due-care-schedule.port.ts` | New | Port interface |
| `src/contexts/care-schedule/application/commands/dispatch-due-care-reminders/` | New | Command + handler |
| `src/contexts/care-schedule/infrastructure/adapters/notify-due-care-schedule.adapter.ts` | New | Adapter (CommandBus → notifications) |
| `src/contexts/care-schedule/infrastructure/schedulers/due-care-reminders.scheduler.ts` | New | `@Cron(EVERY_MINUTE)` |
| `src/contexts/care-schedule/domain/repositories/write/care-schedule-write.repository.ts` | Modified | + `findDueForReminder(now)` |
| `src/contexts/care-schedule/infrastructure/persistence/typeorm/entities/care-schedule.entity.ts` | Modified | + `last_notified_for_due_at` column |
| `src/database/migrations/1780000000026-CreatePushSubscriptions.ts` | New | `push_subscriptions` table |
| `src/database/migrations/1780000000027-AddLastNotifiedForDueAtToCareSchedules.ts` | New | Column add |
| `src/core/config/env.validation.ts` | Modified | VAPID env vars |
| `src/core/core.module.ts` | Modified | `ScheduleModule.forRoot()` |
| `src/app.module.ts` | Modified | Register `NotificationsModule` |
| `package.json` | Modified | `@nestjs/schedule`, `web-push`, `@types/web-push` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Multiple API replicas in the future → duplicate sends | Low today, Med later | Documented as explicit out-of-scope; revisit with a Postgres advisory lock or moving the cron to a dedicated worker before scaling replicas |
| Expired/invalid push subscription (uninstalled browser, revoked permission) | Med | `WebPushAdapter` catches `410`/`404` and self-unregisters via `UnregisterPushSubscriptionCommand` |
| VAPID keys missing/misconfigured in an environment | Low | `env.validation.ts` fails fast at boot (same pattern as existing required env vars) |
| `SendPushNotificationCommand` reachable without a transport entry point could be mistaken for a bug by a future maintainer | Low | Explicitly documented in design.md + context README; a static test (mirroring `*-no-cross-context-import.spec.ts`) asserts no controller/resolver/MCP tool references it |
| Reminder marked "sent" even if every subscription delivery failed (browser offline, etc.) | Low | Accepted trade-off for v1 — a schedule remains visible/actionable in-app regardless; retry queue is out of scope |
| Cron interval (1 min) under load with many due schedules | Low | `findDueForReminder` is an indexed query (`active`, `next_due_at`); revisit with pagination if schedule volume grows significantly |

## Rollback Plan

Both migrations are additive (`down()` drops the new table / column
respectively) with no data migration in other tables. Revert the branch; run
`down()` on both migrations in reverse order
(`1780000000027` then `1780000000026`). The cron and adapter are pure
additions — reverting them restores `care-schedule` to its current
behaviour with zero impact on other contexts. No feature flag needed given
the additive, isolated nature of the change.

## Dependencies

- `@nestjs/schedule` (new)
- `web-push` + `@types/web-push` (new)
- Reuses `JwtAuthGuard`, `@SkipSpace()`, `BaseAggregate`/`BaseBuilder`,
  `UuidValueObject`/`StringValueObject`/`DateValueObject` from
  `@sisques-labs/nestjs-kit`.

## Success Criteria

- [ ] A care-schedule task becoming due triggers a push notification to the
      owning user's registered devices within one cron tick (≤ 1 minute).
- [ ] `lastNotifiedForDueAt` prevents a duplicate reminder for the same due
      occurrence; a new reminder fires after the schedule is completed and
      becomes due again.
- [ ] Register/unregister endpoints work via REST, GraphQL, and MCP, guarded
      by `JwtAuthGuard` only (no space required).
- [ ] `SendPushNotificationCommand` has zero transport entry points (REST,
      GraphQL, MCP) — verified by a static source-scan test.
- [ ] An expired push subscription is automatically removed on next delivery
      attempt.
- [ ] No `@contexts/notifications` import in `care-schedule` outside
      `infrastructure/adapters/notify-due-care-schedule.adapter.ts`.
- [ ] Unit, integration, and e2e tests green; coverage ≥ 80%.
