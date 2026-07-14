# Notifications Context

## What this context owns

The `notifications` context is a **tenant-scoped, per-user in-app notification
feed**, with real-time delivery to connected web clients via Server-Sent
Events (SSE).

It owns:

- **Notifications** — one row per `(condition instance, recipient)`. A
  condition instance is a due care schedule, a low-stock inventory item, or
  an inventory item entering its expiry window.
- **Dedupe + fan-out** — given a single "this condition is/isn't currently
  true" signal, decides whether to open a new notification (one per active
  space member) or resolve an already-open one.
- **Real-time delivery** — `GET /notifications/stream` (SSE), pushing a
  message the instant a notification is created, marked read, or resolved.

What it does **not** own: detecting *when* a condition is worth notifying
about. That decision belongs to the context that owns the underlying
business rule (`care-schedule` decides what counts as "due"; `inventory`
decides what counts as "low stock" or "expiring soon"). Those contexts push
into `notifications` via their own port — `notifications` never reaches into
them to ask. See "Architecture: who decides what" below.

---

## Architecture: who decides what

Earlier revisions of this context pulled state from `care-schedule` and
`inventory` on a central cron and diffed it against open notifications
itself. That put a decision that belongs to those contexts — "is this
condition currently true?" — inside `notifications`, and required
`notifications` to own read ports into both of them.

The current design inverts that: **the owning context decides *when* to
notify; `notifications` decides *how*.**

```
care-schedule/inventory (owns the business rule)
  │
  │  "this condition is/isn't true right now, for this entity"
  ▼
UpsertConditionNotificationCommand { type, referenceType, referenceId, payload, active }
  │
  ▼
notifications (owns dedupe, fan-out, delivery)
  - active: true  + no open notification for dedupeKey  → create one per active space member
  - active: true  + already open                        → no-op (idempotent)
  - active: false + an open notification exists          → resolve it
  - active: false + nothing open                         → no-op (idempotent)
```

Each source context calls this through its **own** `INotificationDispatcherPort`
(defined and owned by that context, per the project's port/adapter
convention — the consumer owns the port, never the target). `notifications`
exposes exactly one command for this: `UpsertConditionNotificationCommand`.
It has no idea `care-schedule` or `inventory` exist.

**Why not centralize the "when" too?** `INVENTORY_LOW_STOCK` is fully
event-driven — quantity and threshold only change via a command in
`inventory`, so both entering and exiting low-stock are triggered exactly at
the mutation that causes them (see `inventory`'s README). `CARE_SCHEDULE_DUE`
and `INVENTORY_EXPIRING_SOON` are calendar-based — nothing mutates when a
deadline arrives, so *entering* that state still needs a periodic sweep, but
it lives in the owning context's own cron now, not a shared one in
`notifications`. *Exiting* those two is still mutation-triggered (completing
a schedule, updating/deleting an item), so no sweep is needed for that
direction either. See each context's README for its own detection logic.

`status` (`UNREAD`/`READ`) and `resolvedAt` remain **independent axes**:
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
| `payload` | `NotificationPayloadValueObject` | Display-ready snapshot data, shape depends on `type` (e.g. `activityType` for a due schedule, `itemName` for an inventory condition) |
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
| `UpsertConditionNotificationCommand` | The only entry point other contexts use. No REST/GraphQL/MCP surface — dispatched exclusively by `care-schedule`/`inventory` (via their own `INotificationDispatcherPort`), always within a `SpaceContext.run()` scope |

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
`infrastructure/adapters/`:

| Port | Adapter | Backs onto |
|------|---------|------------|
| `IUserDirectoryPort` | `UserDirectoryAdapter` | `users`' `UserFindByCriteriaQuery`, scoped by the ambient `SpaceContext` — resolves active space members for fan-out |
| `INotificationDispatcherPort` | `NoopNotificationDispatcherAdapter` (v1) | Seam for a future push/email channel; v1 only logs. (Unrelated to the `INotificationDispatcherPort` that `care-schedule`/`inventory` each define on their own side — same name, different port, different direction.) |

`care-schedule` and `inventory` have **zero** imports from or references to
`notifications` outside their own `infrastructure/adapters/` — enforced by
`notifications-no-cross-context-import.spec.ts` (and the mirror boundary
test in each of those contexts).

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

Config (`src/core/config/notifications.config.ts`):

| Env var | Default | Purpose |
|---------|---------|---------|
| `NOTIFICATIONS_SSE_HEARTBEAT_MS` | `20000` | SSE keep-alive interval |

(Detection windows and reconciliation cron config now live in `care-schedule`
and `inventory`'s own config — see their READMEs.)

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
(dedupe lookup via `findOpenByDedupeKey`). A **partial unique index**
`(dedupe_key, user_id) WHERE resolved_at IS NULL` guards against duplicate
open notifications from a source context calling `UpsertConditionNotificationCommand`
concurrently for the same condition. FKs to `users`/`spaces` (`ON DELETE
CASCADE`).
