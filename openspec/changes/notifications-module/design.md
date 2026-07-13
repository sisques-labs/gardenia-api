# Design: Notifications Module (`notifications`)

## Technical Approach

`notifications` follows the standard context shape (domain → application →
infrastructure → transport, CQRS, dual transport, tenant isolation via
`createTenantRepository`) with one addition none of the other contexts have:
a **reconciliation engine** driven by a cron job instead of a user command,
and **three outbound ports** into other contexts (two read-only alert
sources, one recipient directory) plus one **inbound addition** to `spaces`.

### The core model: condition instances, not events

A naive design would create a `Notification` the instant a domain event fires
(`InventoryItemQuantityAdjusted` crossing the threshold, say). That doesn't
work for `CARE_SCHEDULE_DUE` or `INVENTORY_EXPIRING_SOON` — "becoming due" and
"entering the expiry window" aren't triggered by any command, they happen
because time passes. So every notification type in this context is modeled
the same way: a **condition instance**, identified by a `dedupeKey`, that is
either open or resolved.

```
dedupeKey = `${type}:${referenceId}`          // e.g. "CARE_SCHEDULE_DUE:8f3a...", "INVENTORY_LOW_STOCK:2c91..."
```

On every reconciliation cycle, for a given space:

1. Fetch the current set of condition-matching entities from the source
   context (schedules due within the window; items low on stock; items
   expiring within the window).
2. Fetch the current set of **open** notifications (`resolvedAt IS NULL`) for
   that space, grouped by `dedupeKey`.
3. **Diff:**
   - Condition matches, no open notification for that `dedupeKey` → create
     one `NotificationAggregate` per active space member (fan-out), all
     sharing the same `dedupeKey`.
   - Open notification exists, condition still matches → no-op (this is what
     makes the job idempotent and safe to run every 15 minutes without
     spamming).
   - Open notification exists, condition no longer matches (schedule
     completed/deactivated, item restocked above threshold, item's
     `expiresAt` pushed out or deleted) → `resolve()` every notification
     sharing that `dedupeKey`.

This gives one mental model for all three types today and for any type added
later: **"is this condition currently true, and if so, is there already an
open notification for it."** `READ`/`UNREAD` is a completely separate axis —
resolving a notification does not change whether the user read it, and
reading a notification does not resolve it. A resolved-but-unread
notification simply drops out of the "active alerts" view but stays in
history.

### Why polling instead of the Kafka forwarder

The codebase already has a general domain-event-to-Kafka forwarder
(`MessagingModule` in `@sisques-labs/nestjs-kit/messaging`, wired in
`core.module.ts`) with a symmetric consumer port (`EVENT_CONSUMER`,
`run(groupId, topics, handler)`). It was tempting to have `notifications`
consume `gardenia-api.care-schedule` / `gardenia-api.inventory` topics
instead of polling. Rejected for v1 because:

- `KAFKA_ENABLED=false` in every environment today (`.env.example`, no
  broker in `docker-compose.yml`) — building the core reminder loop on it
  would make a currently-optional piece of infra load-bearing.
- The `harden-context-boundaries` change explicitly scoped "asynchronous
  messaging / integration events" as a **later** step, not touched yet.
- Neither `CARE_SCHEDULE_DUE` nor `INVENTORY_EXPIRING_SOON` has a triggering
  event at all — they're time-based, so even with Kafka enabled we'd still
  need a poller for those two of the three v1 types. Once a poller exists
  for those, using it for the third (`INVENTORY_LOW_STOCK`, which *does* have
  a natural trigger event) too is simpler than running two different
  mechanisms.

The Kafka path remains available and is the natural mechanism for a future
real-time/push phase — noted as a follow-up, not built here.

### Why fan-out to every space member (not just the owner)

Rejected alternative: notify only the space's `OWNER`-role member. Rejected
because `care-schedule` and `inventory` are already fully collaborative in
this codebase — any space member can create/update/complete a schedule or
adjust stock, with no ownership gate (see both contexts' READMEs). Limiting
*visibility* of the resulting alerts to the owner while every member can
cause and resolve them would be an inconsistent permission model. Fan-out is
one row per `(dedupeKey, recipient userId)`; a large space with many members
means more rows, not more complexity — acceptable for the household/allotment
scale this product targets.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|------------------------|-----------|
| Cross-context read pattern | `notifications`-owned ports (`ICareScheduleAlertsPort`, `IInventoryAlertsPort`, `IUserDirectoryPort`, `ISpaceDirectoryPort`) + adapters dispatching existing `QueryBus` queries | Kafka event consumption | No new infra dependency; matches `spaces → weather` / `plants → qr` precedent; two of three v1 types have no event to consume anyway |
| Notification granularity | One row per `(dedupeKey, recipient)`; fan-out to all active members | One row per space (shared read state); owner-only recipient | Per-user read state is the correct UX (a notification I read shouldn't still show unread badge to my spouse); fan-out matches the contexts' existing no-ownership-gate model |
| Dedupe/lifecycle | `dedupeKey` + `resolvedAt`, reconciled every cycle (idempotent diff) | Event-sourced trigger key per notification instance; ad-hoc "don't renotify for N hours" cooldown | A reconcile-to-current-truth model is simpler to reason about and self-heals if a cycle is missed; a cooldown timer would still show a stale "low stock" after restocking |
| Scheduling mechanism | `@nestjs/schedule` `@Cron()`, interval configurable via env, default 15 min | `setInterval` in a bootstrap service; external scheduler (e.g. k8s CronJob hitting an internal endpoint) | `@nestjs/schedule` is the standard, testable NestJS primitive; no new deployment topology needed for v1 |
| Payload shape | `payload: JsonValueObject` (from `@sisques-labs/nestjs-kit`) carrying type-specific, display-ready data (`plantName`, `activityType`, `nextDueAt` / `itemName`, `quantity`, `unit`, `lowStockThreshold` / `itemName`, `expiresAt`) | Fully relational columns per type; no payload, web re-fetches the referenced entity | API stays framework-agnostic of *how* the web renders text (no server-side i18n); avoids an extra round trip per notification row to hydrate a plant/item name that may since have changed anyway (payload is a snapshot at creation time, which is desirable — a plant later renamed shouldn't rewrite history) |
| Read/resolved as separate axes | `status: UNREAD \| READ` + `resolvedAt: Date \| null`, independent | Single `status` enum (`UNREAD \| READ \| RESOLVED \| RESOLVED_UNREAD`) | Two orthogonal booleans are simpler to query and reason about than a 4-state enum that conflates them |
| Channel dispatch | `INotificationDispatcherPort`, `NoopNotificationDispatcherAdapter` in v1 | Skip the port entirely, add it when push/email actually lands | User explicitly asked for the seam to exist now; a no-op adapter costs nothing and documents the extension point directly in code |
| Enumerating all spaces | New `SpaceFindAllIdsQuery` in `spaces`, internal-only | Give `notifications` a direct repository read on the `spaces` table; have every space "self-register" for reconciliation via an event | Respects the boundary rule (all cross-context reads go through the owning context's `QueryBus` surface); a plain id-list query is the smallest possible addition and needs no transport surface since it has exactly one caller |
| Duplicate-row race protection | Partial unique index `(dedupe_key, user_id) WHERE resolved_at IS NULL` | Row-level advisory lock per space during reconciliation; rely on application-level check only | Defense in depth against an overrunning job cycle overlapping the next; a partial index is cheap and Postgres-native |
| Overlapping job runs | In-process re-entrancy guard (skip a tick if the previous sweep is still running) + the partial unique index as a backstop | Distributed lock (Redis/Postgres advisory lock) across instances | v1 runs a single API instance per environment; a cross-instance lock is a real follow-up the moment this is horizontally scaled, called out as a risk, not solved here |

## Data Flow

### User-facing read path

```
REST/GraphQL/MCP ──(JwtAuthGuard + SpaceGuard)──> Query
        │
   QueryBus ──> NotificationFindByCriteriaQueryHandler ──> ReadRepo(tenant, WHERE space_id AND user_id = current) ──> ViewModel[]
   QueryBus ──> NotificationsUnreadCountQueryHandler    ──> ReadRepo(tenant, WHERE space_id AND user_id = current AND status = UNREAD AND resolved_at IS NULL) ──> count
```

### User-facing write path

```
REST/GraphQL/MCP ──> MarkNotificationReadCommand(notificationId)
        │
   CommandBus ──> Handler ──> AssertNotificationExistsService (write repo)
        │              ──> ownership check: aggregate.userId === @CurrentUser (else 403)
        │              ──> aggregate.markRead() ──> NotificationReadEvent
        │              ──> save via write repo
```

### Reconciliation path (the new shape)

```
@Cron(NOTIFICATIONS_RECONCILE_CRON)               // NotificationsReconciliationJob (transport/jobs/)
   │
   ├─ ISpaceDirectoryPort.listAllSpaceIds()        // → SpaceFindAllIdsQuery, no SpaceContext needed (cross-tenant by nature)
   │
   └─ for each spaceId (sequential, best-effort — one failure logged & skipped):
        SpaceContext.run(spaceId, async () => {
          CommandBus.execute(new ReconcileSpaceNotificationsCommand())
        })

ReconcileSpaceNotificationsCommandHandler (application/commands/reconcile-space-notifications/)
   │
   ├─ ICareScheduleAlertsPort.findDueWithin(windowHours)     // → CareScheduleFindByCriteriaQuery({ active: true, dueBefore })
   ├─ IInventoryAlertsPort.findLowStock()                    // → InventoryItemFindByCriteriaQuery({ lowStock: true })
   ├─ IInventoryAlertsPort.findExpiringWithin(windowDays)    // → InventoryItemFindByCriteriaQuery({ expiringBefore })
   ├─ IUserDirectoryPort.listActiveMemberUserIds()           // → UsersFindByCriteriaQuery({}), paged
   ├─ NotificationReadRepository.findOpenGroupedByDedupeKey() // current open notifications in this space
   │
   └─ NotificationReconciliationService.reconcile(...)        // pure diff logic, unit-testable without a DB
        → { toCreate: {dedupeKey, type, referenceType, referenceId, payload}[], toResolve: dedupeKey[] }
        → write repo: batch-create (fan-out × members) / batch-resolve
        → each created notification → INotificationDispatcherPort.dispatch() (no-op in v1)
```

`NotificationReconciliationService` is a plain application service with no
I/O — it takes the three "current condition" lists, the current open-notification
groups, and the member list, and returns a creation/resolution plan. This is
the one piece of this feature with real branching logic, so it's isolated and
unit-tested in isolation from the ports/repos/cron plumbing.

## File Changes

New under `src/contexts/notifications/` (≈50 files, sized similarly to
`inventory-module` plus the ports/adapters/job):

```
domain/
  aggregates/notification.aggregate.ts
  builders/notification.builder.ts
  enums/notification-type.enum.ts                 # CARE_SCHEDULE_DUE | INVENTORY_LOW_STOCK | INVENTORY_EXPIRING_SOON
  enums/notification-reference-type.enum.ts        # CARE_SCHEDULE | INVENTORY_ITEM
  enums/notification-status.enum.ts                # UNREAD | READ
  events/notification-created/notification-created.event.ts
  events/notification-read/notification-read.event.ts
  events/notification-resolved/notification-resolved.event.ts
  events/interfaces/notification-event-data.interface.ts
  exceptions/notification-not-found.exception.ts             # 404
  exceptions/notification-not-owned.exception.ts              # 403
  interfaces/notification.interface.ts
  primitives/notification.primitives.ts
  repositories/read/notification-read.repository.ts           # INotificationReadRepository + token; findOpenGroupedByDedupeKey
  repositories/write/notification-write.repository.ts         # INotificationWriteRepository + token; saveMany
  value-objects/notification-id/notification-id.value-object.ts
  value-objects/notification-dedupe-key/notification-dedupe-key.value-object.ts
  value-objects/notification-type/notification-type.value-object.ts
  value-objects/notification-reference-type/notification-reference-type.value-object.ts
  value-objects/notification-payload/notification-payload.value-object.ts    # extends JsonValueObject
  view-models/notification.view-model.ts
application/
  ports/care-schedule-alerts.port.ts               # ICareScheduleAlertsPort
  ports/inventory-alerts.port.ts                    # IInventoryAlertsPort
  ports/user-directory.port.ts                      # IUserDirectoryPort
  ports/space-directory.port.ts                     # ISpaceDirectoryPort
  ports/notification-dispatcher.port.ts             # INotificationDispatcherPort
  services/notification-reconciliation/notification-reconciliation.service.ts   # pure diff logic
  services/write/assert-notification-exists/assert-notification-exists.service.ts
  commands/mark-notification-read/mark-notification-read.command.ts
  commands/mark-notification-read/mark-notification-read.handler.ts
  commands/mark-all-notifications-read/mark-all-notifications-read.command.ts
  commands/mark-all-notifications-read/mark-all-notifications-read.handler.ts
  commands/reconcile-space-notifications/reconcile-space-notifications.command.ts   # no transport surface
  commands/reconcile-space-notifications/reconcile-space-notifications.handler.ts
  queries/notification-find-by-criteria/notification-find-by-criteria.query.ts
  queries/notification-find-by-criteria/notification-find-by-criteria.handler.ts
  queries/notifications-unread-count/notifications-unread-count.query.ts
  queries/notifications-unread-count/notifications-unread-count.handler.ts
infrastructure/
  adapters/care-schedule-alerts.adapter.ts          # dispatches CareScheduleFindByCriteriaQuery
  adapters/inventory-alerts.adapter.ts              # dispatches InventoryItemFindByCriteriaQuery (x2 uses)
  adapters/user-directory.adapter.ts                # dispatches UsersFindByCriteriaQuery, paged
  adapters/space-directory.adapter.ts               # dispatches SpaceFindAllIdsQuery
  adapters/noop-notification-dispatcher.adapter.ts
  persistence/typeorm/entities/notification.entity.ts
  persistence/typeorm/mappers/notification-typeorm.mapper.ts
  persistence/typeorm/repositories/notification-typeorm-write.repository.ts
  persistence/typeorm/repositories/notification-typeorm-read.repository.ts
transport/
  jobs/notifications-reconciliation.job.ts          # @Cron; iterates spaces, dispatches ReconcileSpaceNotificationsCommand
  rest/controllers/notifications.controller.ts
  rest/dtos/notification-rest-response.dto.ts
  rest/mappers/notification/notification.mapper.ts
  graphql/resolvers/notification-queries.resolver.ts
  graphql/resolvers/notification-mutations.resolver.ts
  graphql/dtos/requests/notification-criteria-graphql.dto.ts
  graphql/dtos/responses/notification.response.dto.ts
  graphql/mappers/notification.mapper.ts
  graphql/enums/notifications-registered-enums.graphql.ts
  graphql/enums/notification-queryable-field.enum.ts
  graphql/registries/notification-filterable-fields.registry.ts
  graphql/dtos/requests/notification-filter.input.ts
  graphql/dtos/requests/notification-sort.input.ts
  mcp/tools/notification-find-by-criteria.tool.ts
  mcp/tools/notification-unread-count.tool.ts
  mcp/tools/notification-mark-read.tool.ts
  mcp/tools/notification-mark-all-read.tool.ts
  mcp/schemas/notification-find-by-criteria.schema.ts
  mcp/schemas/notification-mark-read.schema.ts
notifications.module.ts
README.md
```

Plus one addition to the existing `spaces` context:

```
src/contexts/spaces/application/queries/space-find-all-ids/space-find-all-ids.query.ts
src/contexts/spaces/application/queries/space-find-all-ids/space-find-all-ids.handler.ts
```

(No transport files for this query — it is dispatched over `QueryBus` only by
`notifications`' `SpaceDirectoryAdapter`.)

| File | Action | Description |
|------|--------|--------------|
| `src/database/migrations/1780000000025-CreateNotifications.ts` | Create | `notifications` table, indexes, partial unique index |
| `src/core/core.module.ts` | Modify | Add `ScheduleModule.forRoot()` to `CORE_MODULES` |
| `src/app.module.ts` | Modify | Register `NotificationsModule` |
| `src/core/config/notifications.config.ts` | Create | `NOTIFICATIONS_RECONCILE_ENABLED`, `NOTIFICATIONS_RECONCILE_CRON`, `NOTIFICATIONS_CARE_SCHEDULE_DUE_WINDOW_HOURS`, `NOTIFICATIONS_INVENTORY_EXPIRING_WINDOW_DAYS` |
| `src/contexts/spaces/spaces.module.ts` | Modify | Register `SpaceFindAllIdsQuery` handler |
| `src/contexts/spaces/README.md` | Modify | Document the new internal-only query |
| `package.json` | Modify | Add `@nestjs/schedule` |

## Interfaces / Contracts

```ts
// domain/enums/notification-type.enum.ts
export enum NotificationTypeEnum {
  CARE_SCHEDULE_DUE = 'CARE_SCHEDULE_DUE',
  INVENTORY_LOW_STOCK = 'INVENTORY_LOW_STOCK',
  INVENTORY_EXPIRING_SOON = 'INVENTORY_EXPIRING_SOON',
}

// domain/enums/notification-reference-type.enum.ts
export enum NotificationReferenceTypeEnum {
  CARE_SCHEDULE = 'CARE_SCHEDULE',
  INVENTORY_ITEM = 'INVENTORY_ITEM',
}

// domain/enums/notification-status.enum.ts
export enum NotificationStatusEnum {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

// application/ports/care-schedule-alerts.port.ts
export const CARE_SCHEDULE_ALERTS_PORT = Symbol('CARE_SCHEDULE_ALERTS_PORT');
export interface IDueCareSchedule {
  scheduleId: string;
  plantId: string;
  activityType: string;
  nextDueAt: Date;
}
export interface ICareScheduleAlertsPort {
  findDueWithin(windowHours: number): Promise<IDueCareSchedule[]>;
}

// application/ports/inventory-alerts.port.ts
export const INVENTORY_ALERTS_PORT = Symbol('INVENTORY_ALERTS_PORT');
export interface ILowStockItem {
  itemId: string;
  name: string;
  itemType: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
}
export interface IExpiringItem {
  itemId: string;
  name: string;
  itemType: string;
  expiresAt: Date;
}
export interface IInventoryAlertsPort {
  findLowStock(): Promise<ILowStockItem[]>;
  findExpiringWithin(windowDays: number): Promise<IExpiringItem[]>;
}

// application/ports/user-directory.port.ts
export const USER_DIRECTORY_PORT = Symbol('USER_DIRECTORY_PORT');
export interface IUserDirectoryPort {
  listActiveMemberUserIds(): Promise<string[]>; // reads current SpaceContext
}

// application/ports/space-directory.port.ts
export const SPACE_DIRECTORY_PORT = Symbol('SPACE_DIRECTORY_PORT');
export interface ISpaceDirectoryPort {
  listAllSpaceIds(): Promise<string[]>; // cross-tenant by nature, no SpaceContext required
}

// application/ports/notification-dispatcher.port.ts
export const NOTIFICATION_DISPATCHER_PORT = Symbol('NOTIFICATION_DISPATCHER_PORT');
export interface INotificationDispatcherPort {
  dispatch(notification: NotificationViewModel): Promise<void>;
}

// application/services/notification-reconciliation/notification-reconciliation.service.ts
export interface IReconciliationPlan {
  toCreate: {
    dedupeKey: string;
    type: NotificationTypeEnum;
    referenceType: NotificationReferenceTypeEnum;
    referenceId: string;
    payload: Record<string, unknown>;
  }[];
  toResolveDedupeKeys: string[];
}

// domain/repositories/read/notification-read.repository.ts
export const NOTIFICATION_READ_REPOSITORY = Symbol('NOTIFICATION_READ_REPOSITORY');
export type NotificationCriteria = {
  status?: NotificationStatusEnum;
  type?: NotificationTypeEnum;
  page?: number;
  limit?: number;
};
export interface INotificationReadRepository extends IBaseReadRepository<NotificationViewModel> {
  findByCriteria(criteria: NotificationCriteria): Promise<NotificationViewModel[]>;
  countUnread(): Promise<number>;
  findOpenGroupedByDedupeKey(): Promise<Map<string, NotificationViewModel[]>>;
}
```

**Entity columns**: `id` (uuid pk), `type` (varchar NOT NULL), `reference_type`
(varchar NOT NULL), `reference_id` (uuid NOT NULL), `dedupe_key` (varchar NOT
NULL), `payload` (jsonb NOT NULL DEFAULT '{}'), `status` (varchar NOT NULL
DEFAULT 'UNREAD'), `read_at` (timestamptz NULL), `resolved_at` (timestamptz
NULL), `user_id` (uuid NOT NULL — the recipient), `space_id` (uuid NOT NULL),
`created_at`, `updated_at`. Indexes: `(space_id, user_id, status)` for the
list/count read path; `(space_id, dedupe_key)` for the reconciliation diff;
partial unique `(dedupe_key, user_id) WHERE resolved_at IS NULL` for the race
guard.

**Aggregate**: `create()`, `markRead()` (idempotent — no-op + no event if
already `READ`), `resolve()` (sets `resolvedAt`; idempotent), `delete()`
(v1: not exposed publicly, reserved for a future retention job). No
`update()` — a notification's `type`/`referenceId`/`payload` are immutable
after creation; a changed underlying entity produces a *new* condition
instance (new `dedupeKey`) via resolve-then-recreate, not a mutation.

**Ownership check**: `MarkNotificationReadCommandHandler` loads via
`AssertNotificationExistsService`, then compares `aggregate.userId` against
`@CurrentUser`; mismatch throws `NotificationNotOwnedException` (403). This
mirrors the pattern REST/GraphQL already use elsewhere for user-scoped (not
just space-scoped) resources.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `NotificationReconciliationService.reconcile()` — the core branching logic: create-when-open-missing, no-op-when-still-open, resolve-when-condition-cleared, multi-member fan-out, multi-type mixing; aggregate `create`/`markRead` (idempotent)/`resolve` (idempotent) event emission; VOs (`dedupeKey` format, `payload` JSON validity); adapters (each dispatches the right query with the right args, maps the result shape) | Jest, `jest.Mocked<T>`, no DB |
| Integration | Tenant isolation (space A's notifications invisible under space B); `(dedupe_key, user_id) WHERE resolved_at IS NULL` partial unique index actually rejects a duplicate insert; `findOpenGroupedByDedupeKey` groups correctly; `countUnread` excludes resolved | Test DB + `SpaceContext` |
| E2E | Full reconciliation round trip: seed a due `care-schedule` + a low-stock `inventory` item + two space members → dispatch `ReconcileSpaceNotificationsCommand` directly (not the cron, for determinism) → assert 2 notifications × 2 members = 4 rows; complete the schedule → re-run → assert the 2 `CARE_SCHEDULE_DUE` rows are resolved and the 2 `INVENTORY_LOW_STOCK` rows are untouched; REST + GraphQL list/unread-count/mark-read/mark-all-read behind guards; mark-read on another user's notification → 403; tenant isolation → 404 | supertest |
| Static | `notifications-no-cross-context-import.spec.ts`: no import from `@contexts/care-schedule/domain`, `@contexts/care-schedule/application`, `@contexts/inventory/domain`, `@contexts/inventory/application`, `@contexts/users/domain`, `@contexts/users/application`, `@contexts/spaces/domain`, `@contexts/spaces/application` outside `notifications/infrastructure/adapters/` | Jest source scan, mirrors existing boundary tests |

The reconciliation job itself (`@Cron`) is intentionally kept as thin as
possible — enumerate spaces, call the command per space, log and continue on
error — so it needs no dedicated test beyond a unit test asserting the
per-space isolation (one space throwing doesn't stop the loop) and that it's
a no-op when `NOTIFICATIONS_RECONCILE_ENABLED=false`.

## Migration / Rollout

Single additive migration `1780000000025`; `down()` drops the `notifications`
table (including its partial unique index) and does not touch any other
table. `spaces`' new `SpaceFindAllIdsQuery` needs no migration (no schema
change). Rollout is safe to ship with `NOTIFICATIONS_RECONCILE_ENABLED=false`
initially in production if the team wants the schema + read/write APIs live
before the job starts creating rows.

## Open Questions

- Configurable per-user windows/mute preferences are explicitly deferred
  (Out of Scope) — flag if product wants this pulled into v1 before
  implementation starts, since it would change the `notifications` table
  shape (a preferences sub-resource) rather than being purely additive later.
- Retention/cleanup of old resolved+read notifications (e.g. a 90-day purge
  job) is not addressed — the table grows unbounded in v1. Acceptable at
  current scale; flagged as a v2 follow-up alongside real push/email.
