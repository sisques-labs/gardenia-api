# Notifications Context

## Purpose

The `notifications` context stores each user's Web Push subscriptions and
delivers push notifications to them. It has **no idea `care-schedule` (or
any other context) exists** — it's a small, generic "remember a browser's
push subscription, and send a push to all of a user's subscriptions"
capability, consumed by other contexts through a BullMQ queue.

This context is **not tenant-scoped** — a push subscription belongs to a
`userId` + browser pair, independent of which space is active. There is no
`spaceId` anywhere in this context.

> Origin: `openspec/changes/care-schedule-push-reminders/`. Built to give
> `care-schedule` an immediate push the moment a task becomes due, without a
> polling cron — see that change's `design.md` for the full rationale.

---

## Core aggregate

### `PushSubscriptionAggregate`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `PushSubscriptionIdValueObject` | UUID generated on creation |
| `userId` | `UuidValueObject` | Owner of the subscription |
| `endpoint` | `PushSubscriptionEndpointValueObject` | The browser's push endpoint URL — globally unique |
| `p256dh` | `PushSubscriptionP256dhValueObject` | Public key from the browser subscription |
| `auth` | `PushSubscriptionAuthValueObject` | Auth secret from the browser subscription |
| `userAgent` | `StringValueObject \| null` | Optional, informational only |
| `createdAt` / `updatedAt` | `Date` | Managed by TypeORM |

Domain methods:
- `create()` — applies `PushSubscriptionRegisteredEvent`
- `reassign(userId, p256dh, auth, userAgent)` — re-points an existing
  subscription (matched by `endpoint`) at its latest owner and keys. **No
  event** — this is upsert bookkeeping, not a user-facing fact.
- `delete()` — applies `PushSubscriptionUnregisteredEvent`

---

## Architecture layers

| Layer | Path | What lives here |
|-------|------|-----------------|
| **domain** | `domain/` | `PushSubscriptionAggregate`, builder, value objects (incl. the message-content VOs used only by `SendPushNotificationCommand`), events, `PushSubscriptionNotFoundException` |
| **application** | `application/` | `RegisterPushSubscriptionCommand`, `UnregisterPushSubscriptionCommand`, `SendPushNotificationCommand` + handlers; `IPushSenderPort` |
| **infrastructure** | `infrastructure/` | `PushSubscriptionTypeOrm{Read,Write}Repository`, `PushSubscriptionTypeOrmMapper`, `PushSubscriptionTypeOrmEntity`, `WebPushAdapter` (implements `IPushSenderPort` via the `web-push` npm package) |
| **transport** | `transport/` | REST controller, GraphQL resolver, MCP tools (register/unregister only), and `transport/queues/push-notifications.processor.ts` — the BullMQ consumer |

---

## Public API

Register/unregister require `Authorization: Bearer <accessToken>`
(`JwtAuthGuard`) but **not** `X-Space-ID` (`@SkipSpace()`).

### REST Endpoints

Base path: `/push-subscriptions`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `POST` | `/push-subscriptions` | 201 | Register (or re-register, by `endpoint`) a subscription |
| `DELETE` | `/push-subscriptions/:id` | 200 | Unregister a subscription |

### GraphQL Operations

| Name | Type | Description |
|------|------|-------------|
| `registerPushSubscription(input)` | Mutation | Returns `MutationResponseDto` (`id` = subscription id) |
| `unregisterPushSubscription(id)` | Mutation | Returns `MutationResponseDto` |

### MCP Tools

| Tool | Action |
|------|--------|
| `push_subscription_register` | Register/re-register a subscription for the calling user |
| `push_subscription_unregister` | Unregister a subscription |

---

## ⚠️ `SendPushNotificationCommand` has NO transport — by design

Unlike every other command in this codebase, `SendPushNotificationCommand`
has **zero** REST, GraphQL, or MCP entry points. This is intentional, not an
oversight: there is no legitimate reason for a client to trigger an
arbitrary push to any `userId` (harassment/spam vector). It is reachable
exclusively via:

1. Internal `CommandBus.execute()` calls, and in practice
2. **`PushNotificationsProcessor`** (`transport/queues/push-notifications.processor.ts`),
   a BullMQ `@Processor('push-notifications')` that consumes jobs and turns
   each into a `SendPushNotificationCommand`.

A static test (`send-push-notification-not-exposed.spec.ts`) asserts no
REST controller, GraphQL resolver, or MCP tool references this command —
if you're tempted to add one, don't; add a new port/consumer instead and
re-read the rationale in
`openspec/changes/care-schedule-push-reminders/design.md`.

**How another context sends a push**: it does NOT call
`SendPushNotificationCommand` directly (that would be a forbidden
cross-context `application` import outside `infrastructure/adapters/`).
Instead, the consuming context defines its own port
(e.g. `care-schedule`'s `IReminderSchedulerPort`) whose adapter enqueues a
plain, duck-typed job — `{ userId, title, body, url? }` — onto the
`push-notifications` BullMQ queue. No cross-context TypeScript import is
needed for this — the queue is the contract.

---

## Commands

| Class | Type | Purpose | Transport |
|-------|------|---------|-----------|
| `RegisterPushSubscriptionCommand` | Command | Upsert a subscription by `endpoint` | REST, GraphQL, MCP |
| `UnregisterPushSubscriptionCommand` | Command | Remove a subscription | REST, GraphQL, MCP |
| `SendPushNotificationCommand` | Command | Deliver a push to all of a user's subscriptions | **None** — BullMQ processor only |

## Domain Events

| Class | When emitted |
|-------|-------------|
| `PushSubscriptionRegisteredEvent` | On `create()` (new endpoint only — re-registering an existing endpoint does not re-emit) |
| `PushSubscriptionUnregisteredEvent` | On `delete()` |

---

## The `push-notifications` BullMQ queue

Registered with `defaultJobOptions: { removeOnComplete: true, removeOnFail: true }`
so a producer can safely reuse a stable `jobId` (e.g. a `care-schedule` id)
across that entity's lifetime — the previous job is always cleaned up before
the id is reused.

`PushNotificationsProcessor` dispatches `SendPushNotificationCommand`. If
that dispatch throws for a reason other than a single subscription's
delivery failure (which `SendPushNotificationCommandHandler` already
absorbs), the processor lets the error propagate so BullMQ's own retry/
backoff applies to the job.

Requires `BullModule.forRootAsync(...)` to be registered globally (see
`src/core/core.module.ts`) with a reachable Redis (`REDIS_HOST`,
`REDIS_PORT`, `REDIS_PASSWORD`).

---

## How to Test This Module

**Unit tests** (no database, no Redis):

```bash
pnpm test src/contexts/notifications
```

**Integration tests** (requires Postgres):

```bash
pnpm test:integration --testPathPattern=notifications
```

**Cross-context isolation tests:**

```bash
pnpm test src/contexts/notifications/notifications-no-cross-context-import.spec.ts
pnpm test src/contexts/notifications/send-push-notification-not-exposed.spec.ts
```

---

## Database

### `push_subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | Indexed |
| `endpoint` | `text` | Unique index — a physical browser+origin registration |
| `p256dh` | `varchar(255)` | |
| `auth` | `varchar(255)` | |
| `user_agent` | `varchar(512)` | Nullable |
| `created_at` / `updated_at` | `timestamptz` | |

Migration: `src/database/migrations/1780000000026-CreatePushSubscriptions.ts`

**Not tenant-scoped** — no `space_id` column, no `createTenantRepository`.

---

## Things to know before making changes

1. **No cross-context imports** — enforced by `notifications-no-cross-context-import.spec.ts`.
2. **`SendPushNotificationCommand` stays transport-less** — enforced by `send-push-notification-not-exposed.spec.ts`. See the warning section above before adding a controller/resolver/tool for it.
3. **`endpoint` uniqueness drives the upsert** — `RegisterPushSubscriptionCommand`'s handler looks up by `endpoint` first; a match reassigns rather than creating a duplicate.
4. **VAPID keys are required at boot** — `env.validation.ts` fails fast if `WEB_PUSH_VAPID_PUBLIC_KEY`/`_PRIVATE_KEY`/`_SUBJECT` are missing.
5. **Redis is a hard dependency for the queue path** — if `BullModule.forRootAsync` can't connect, the app fails to boot, same as Postgres today.
