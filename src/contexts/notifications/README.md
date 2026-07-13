# Notifications Context

## What this context owns

The `notifications` context is a **tenant-scoped, per-user in-app notification
feed**, reconciled from the state of `care-schedule` and `inventory`, with
real-time delivery to connected web clients via Server-Sent Events (SSE).

It owns:

- **Notifications** — one row per `(condition instance, recipient)`. A
  condition instance is a due care schedule, a low-stock inventory item, or
  an inventory item entering its expiry window.
- **Reconciliation** — a scheduled job that periodically diffs the current
  state of `care-schedule`/`inventory` against currently-open notifications,
  creating new ones and resolving cleared ones.
- **Real-time delivery** — `GET /notifications/stream` (SSE), pushing a
  message the instant a notification is created, marked read, or resolved.

What it does **not** own: `care-schedule` and `inventory` themselves — this
context never modifies them, only reads their state through its own
read-only ports. It also owns no push/email delivery yet — see
`INotificationDispatcherPort` below.

---

## The core model: condition instances, not events

Every notification type maps a condition source to a `dedupeKey` of
`{type}:{referenceId}`. On every reconciliation cycle, for a given space:

1. Fetch the current set of condition-matching entities (schedules due
   within the window; items low on stock; items expiring within the
   window).
2. Fetch the current set of **open** notifications (`resolvedAt IS NULL`),
   grouped by `dedupeKey`.
3. **Diff:** condition matches with no open notification → create one per
   active space member (fan-out); open notification with condition still
   matching → no-op (idempotent); open notification whose condition no
   longer matches → resolve it.

`status` (`UNREAD`/`READ`) and `resolvedAt` are **independent axes**:
resolving a notification does not change whether the user read it, and
marking one read does not resolve it.

---

## Core aggregate

### `NotificationAggregate`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `NotificationIdValueObject` | UUID generated on creation |
| `type` | `NotificationTypeValueObject` | `CARE_SCHEDULE_DUE`, `INVENTORY_LOW_STOCK`, `INVENTORY_EXPIRING_SOON` |
| `referenceType` | `NotificationReferenceTypeValueObject` | `CARE_SCHEDULE`, `INVENTORY_ITEM` |
| `referenceId` | `UuidValueObject` | The referenced entity's id |
| `dedupeKey` | `NotificationDedupeKeyValueObject` | `{type}:{referenceId}`; the aggregate constructor rejects a mismatch against `type`/`referenceId` |
| `payload` | `NotificationPayloadValueObject` | Display-ready snapshot data, shape depends on `type` (e.g. `plantName`, `activityType` for a due schedule) |
| `status` | `NotificationStatusValueObject` | `UNREAD` (default) or `READ` |
| `readAt` | `DateValueObject \| null` | Set by `markRead()` |
| `resolvedAt` | `DateValueObject \| null` | Set by `resolve()` |
| `userId` | `UuidValueObject` | The recipient |
| `spaceId` | `UuidValueObject` | Space owning this record |

Domain methods:

- `create()` — applies `NotificationCreatedEvent`
- `markRead()` — idempotent; no-op (no event) if already `READ`
- `resolve()` — idempotent; no-op (no event) if already resolved

The aggregate is built exclusively through `NotificationBuilder`, which
always computes `dedupeKey` from `type` + `referenceId` — callers never pass
it directly.

---

## Public API

### Commands

| Command | Purpose |
|---------|---------|
| `MarkNotificationReadCommand` | Mark a single notification read; rejects (403) if the requester doesn't own it |
| `MarkAllNotificationsReadCommand` | Mark all of the requesting user's unread notifications read |
| `ReconcileSpaceNotificationsCommand` | **Internal only** — no REST/GraphQL/MCP surface. Dispatched exclusively by `NotificationsReconciliationJob`, always within a `SpaceContext.run()` scope |

### Queries

| Query | Purpose |
|-------|---------|
| `NotificationFindByCriteriaQuery` | Paginated/filtered list (`status`, `type`), always scoped to the requesting user + active space |
| `NotificationsUnreadCountQuery` | Unread count for the requesting user + active space |

### Events

`NotificationCreated`, `NotificationRead`, `NotificationResolved`.

---

## Cross-context ports

`notifications` never imports another context's `domain`/`application`
layers — only through its own ports, backed by adapters in
`infrastructure/adapters/` that dispatch the target context's existing
public `FindByCriteriaQuery`s over `QueryBus`:

| Port | Adapter | Backs onto |
|------|---------|------------|
| `ICareScheduleAlertsPort` | `CareScheduleAlertsAdapter` | `care-schedule`'s `CareScheduleFindByCriteriaQuery` (`active: true`, `due_before`) |
| `IInventoryAlertsPort` | `InventoryAlertsAdapter` | `inventory`'s `InventoryItemFindByCriteriaQuery` (`low_stock: true`, `expiresAt <=`) |
| `IUserDirectoryPort` | `UserDirectoryAdapter` | `users`' `UserFindByCriteriaQuery`, scoped by the ambient `SpaceContext` — resolves active space members for fan-out |
| `ISpaceDirectoryPort` | `SpaceDirectoryAdapter` | `spaces`' `SpaceFindAllIdsQuery` (new, internal-only — see `spaces` README) — enumerates every space for the reconciliation sweep |
| `INotificationDispatcherPort` | `NoopNotificationDispatcherAdapter` (v1) | Seam for a future push/email channel; v1 only logs |

`care-schedule`, `inventory`, `users`, and `spaces` have **zero** imports
from or references to `notifications` — enforced by
`notifications-no-cross-context-import.spec.ts`.

---

## Real-time delivery (SSE)

`GET /notifications/stream` (`@Sse()`) pushes a message the instant a
notification changes, for connections belonging to the recipient. Wired
without any new pub/sub infrastructure:

```
NotificationAggregate.create()/markRead()/resolve() ──applies──> EventBus (@nestjs/cqrs)
                                                            │
                                                            └─> NotificationSseForwarderService
                                                                  (subscribes to EventBus, mirrors
                                                                   the existing Kafka forwarder's shape)
                                                                  │
                                                                  └─> NotificationSseConnectionRegistry
                                                                        .publish(userId, spaceId, event)
                                                                        │
                                                                        └─> every open GET /notifications/stream
                                                                            response for that user
```

`NotificationSseConnectionRegistry` is an **in-process** singleton
(`Map<"userId:spaceId", Set<Subject<MessageEvent>>>`) — a real notification
is authoritative in Postgres regardless of SSE delivery; SSE is additive,
not the source of truth. A heartbeat (`NOTIFICATIONS_SSE_HEARTBEAT_MS`,
default 20s) keeps the connection alive through proxies/load balancers.

**Known limitation (v1):** the registry is per-process — a notification
created on one API instance only reaches clients connected to that same
instance. Multi-instance fan-out (Redis pub/sub, or the existing Kafka
forwarder/consumer) is a documented, not-yet-built follow-up.

---

## Reconciliation job

`NotificationsReconciliationJob` (`@Cron`, default `*/15 * * * *`, override
via `NOTIFICATIONS_RECONCILE_CRON`) enumerates every space
(`ISpaceDirectoryPort.listAllSpaceIds()`) and dispatches
`ReconcileSpaceNotificationsCommand` within each space's `SpaceContext.run()`
scope. One space's failure is logged and skipped — it never aborts the
sweep for other spaces. Guarded by `NOTIFICATIONS_RECONCILE_ENABLED`
(default `true`), re-checked on every tick.

Config (`src/core/config/notifications.config.ts`):

| Env var | Default | Purpose |
|---------|---------|---------|
| `NOTIFICATIONS_RECONCILE_ENABLED` | `true` | Opt-out switch, mirrors `KAFKA_ENABLED` |
| `NOTIFICATIONS_RECONCILE_CRON` | `*/15 * * * *` | Sweep interval |
| `NOTIFICATIONS_CARE_SCHEDULE_DUE_WINDOW_HOURS` | `24` | How far ahead a schedule counts as "due" |
| `NOTIFICATIONS_INVENTORY_EXPIRING_WINDOW_DAYS` | `7` | How far ahead an item counts as "expiring soon" |
| `NOTIFICATIONS_SSE_HEARTBEAT_MS` | `20000` | SSE keep-alive interval |

---

## Transport

### REST (`/notifications`)

| Method | Path | Handler |
|--------|------|---------|
| GET | `/notifications` | Find by criteria (`status`, `type`, `page`, `limit`) |
| GET | `/notifications/unread-count` | Unread count |
| GET | `/notifications/stream` | SSE stream |
| PATCH | `/notifications/:id/read` | Mark one read |
| POST | `/notifications/read-all` | Mark all read |

All endpoints (including the SSE stream) are guarded by `JwtAuthGuard` +
`SpaceGuard` and require the `X-Space-ID` header.

### GraphQL

- Queries: `notificationsFindByCriteria`, `notificationsUnreadCount`
- Mutations: `notificationMarkRead`, `notificationsMarkAllRead`
- `notificationsFindByCriteria` uses the typed Criteria pattern
  (`NotificationFilterInput`/`NotificationSortInput`, validated via
  `FilterValidationPipe(notificationFilterableFields)`). Whitelisted fields:
  `type`, `status` (real columns only — `userId`/`spaceId` are implicit and
  excluded, same rationale as every other tenant-scoped context).

### MCP Tools

| Tool | Action |
|------|--------|
| `notification_find_by_criteria` | List notifications |
| `notification_unread_count` | Unread count |
| `notification_mark_read` | Mark one read |
| `notification_mark_all_read` | Mark all read |

---

## Persistence

Table `notifications` (migration `CreateNotifications1780000000025`), tenant
isolated via `createTenantRepository`. Indexes on `space_id`,
`(space_id, user_id, status)` (list/count path), `(space_id, dedupe_key)`
(reconciliation diff). A **partial unique index**
`(dedupe_key, user_id) WHERE resolved_at IS NULL` guards against duplicate
open notifications from an overrunning reconciliation cycle. FKs to
`users`/`spaces` (`ON DELETE CASCADE`).
