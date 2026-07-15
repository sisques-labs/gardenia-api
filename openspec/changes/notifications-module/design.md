# Design: Notifications Module (`notifications`)

## Technical Approach

`notifications` follows the standard context shape (domain → application →
infrastructure → transport, CQRS, dual transport, tenant isolation via
`createTenantRepository`) with two things none of the other contexts have:
a **push-based cross-context integration** (source contexts tell
`notifications` when a condition is/isn't true, rather than `notifications`
polling them) and **real-time delivery over SSE**.

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

`notifications` exposes exactly one command for this,
`UpsertConditionNotificationCommand({ type, referenceType, referenceId,
payload, active })`, dispatched by whichever context owns the underlying
condition:

- `active: true` and no open notification for that `dedupeKey` → create one
  `NotificationAggregate` per active space member (fan-out), all sharing the
  same `dedupeKey`.
- `active: true` and already open → no-op. This is what makes repeated
  dispatches (a sweep re-affirming the same condition every cycle, or a
  mutation handler re-checking after an unrelated field changed) safe and
  idempotent.
- `active: false` and an open notification exists → `resolve()` every
  notification sharing that `dedupeKey`.
- `active: false` and nothing open → no-op.

This gives one mental model for all three types today and for any type added
later: **"is this condition currently true, and if so, is there already an
open notification for it."** `READ`/`UNREAD` is a completely separate axis —
resolving a notification does not change whether the user read it, and
reading a notification does not resolve it. A resolved-but-unread
notification simply drops out of the "active alerts" view but stays in
history.

### Architecture: who decides "when", who decides "how"

**This is the one part of the design that changed after the first review
round**, and it's worth spelling out why, since it reverses this document's
original approach (see "Superseded: the old pull-based reconciliation
engine" below for what was replaced and why it wasn't wrong so much as
misplaced).

The question a reviewer raised: *shouldn't the context that owns a condition
(inventory owning "low stock", care-schedule owning "due") be the one that
decides when to notify, with `notifications` only deciding how the
notification is delivered?* Yes — and the project's own port/adapter
convention already points that way: **the context that needs something from
another context owns the port**, never the target. `notifications` needing
"is this schedule due" is `notifications` reaching into `care-schedule`'s
business rules, which is backwards — `care-schedule` should own the concept
of "due" (it already does, as a domain method) and push the result out.

So the design now is:

```
care-schedule / inventory (owns the business rule — decides WHEN)
  │
  │  "this condition is/isn't true right now, for this entity"
  ▼
UpsertConditionNotificationCommand { type, referenceType, referenceId, payload, active }
  │
  ▼
notifications (owns dedupe, fan-out, delivery — decides HOW)
```

Each source context defines and owns its **own**
`INotificationDispatcherPort` (application/ports/), backed by its own
adapter that dispatches `UpsertConditionNotificationCommand` via the Command
bus. `notifications` never imports or reaches into `care-schedule` or
`inventory` — it has exactly one inbound command and no outbound ports into
either of them.

**Splitting "when" by direction, not just by type.** For each of the three
notification types, entering and exiting the condition don't necessarily
share a trigger:

- **`INVENTORY_LOW_STOCK` is fully event-driven, both ways.** Quantity only
  changes via `AdjustInventoryItemQuantityCommand`; the threshold only via
  `UpdateInventoryItemCommand`. Both handlers recompute
  `InventoryItemAggregate.isLowStock()` after saving and dispatch the result.
  No cron exists for this type — nothing else can move it out of sync.
- **`CARE_SCHEDULE_DUE` and `INVENTORY_EXPIRING_SOON` enter calendar-based**
  — nothing mutates when a deadline arrives, so each owning context keeps a
  periodic sweep for *entering* only (`CheckDueCareSchedulesCommand` /
  `CheckExpiringInventoryItemsCommand`, each queried against that context's
  own read repository — no cross-context read needed, since the "is this
  due/expiring" filter already existed as a queryable field on that
  context's own model).
- **Both of those exit via a mutation**, so no sweep is needed for that
  direction: completing/updating/deleting a care schedule
  (`CompleteCareScheduleCommandHandler`, `UpdateCareScheduleCommandHandler`,
  `DeleteCareScheduleCommandHandler`) or updating/deleting an inventory item
  (`UpdateInventoryItemCommandHandler`,
  `DeleteInventoryItemCommandHandler`/`DeleteInventoryItemsBulkCommandHandler`)
  each recompute (or, for delete, unconditionally report `false`) and
  dispatch the current status right after the mutation.

Net effect: two small per-context crons (each doing strictly less than the
old central one — detection only, no resolve-diffing) instead of one, and
`notifications` shrinks to dedupe + fan-out + delivery with zero read
dependencies on the domain contexts it used to poll.

### Superseded: the old pull-based reconciliation engine

The first implementation had `notifications` own `ICareScheduleAlertsPort`
and `IInventoryAlertsPort`, poll both contexts on a single central cron
(`NotificationsReconciliationJob` → `ReconcileSpaceNotificationsCommand`),
and run a full diff itself (`NotificationReconciliationService`) comparing
"current condition matches" against "currently open notifications" every
cycle. That was replaced by the push-based design above. It wasn't
*incorrect* — the reconcile diff correctly created/resolved notifications —
but it put a decision (what counts as due/low-stock/expiring, and when that
stops being true) inside `notifications`, which had to know both contexts'
query shapes to make it. The push-based design moves that decision to where
the business rule already lives, and `notifications` no longer needs to know
either context exists.

One consequence worth calling out: the old design's resolve path was a
clean, single diff per cycle (compare current-true-set against
previously-open-set). The new design achieves the same outcome by splitting
resolve into "whichever mutation caused the exit, dispatch `false` right
then" — more precise (resolution is instant, not up-to-15-minutes-late) but
spread across more call sites (every mutation handler that can affect the
condition). Reviewed case-by-case above to confirm every exit path is
covered.

### Why polling instead of the Kafka forwarder (for the two crons that remain)

The codebase already has a general domain-event-to-Kafka forwarder
(`MessagingModule` in `@sisques-labs/nestjs-kit/messaging`, wired in
`core.module.ts`). It was tempting to have `care-schedule`/`inventory`
publish Kafka events instead of running their own crons. Rejected because
Kafka is a transport for events that already happened (something mutated) —
it has no mechanism to "wake up" on its own when a calendar date arrives
with no accompanying mutation. Some scheduler is unavoidable for
`CARE_SCHEDULE_DUE`/`INVENTORY_EXPIRING_SOON`'s entering-the-window
transition regardless of which message bus carries the result, so
`@nestjs/schedule`'s `@Cron()` (already the standard, testable primitive in
this codebase) is used directly rather than adding a Kafka round trip that
still needs a poller behind it.

### Real-time delivery: SSE over the in-process EventBus

Detection (mutation-triggered or a small periodic sweep) decides *when the
server learns* a condition changed. It says nothing about *when the browser
finds out* a notification row now exists — without a delivery mechanism, the
web client would have to poll on its own to notice. Rather than that,
`notifications` pushes to connected clients over Server-Sent Events (SSE),
so a client that has the app open sees a new notification (or a
read/resolved state change from another of the user's own tabs/devices)
within seconds, without asking.

**Why SSE, not WebSocket or GraphQL subscriptions.** The data only ever flows
server → client (no client-to-server messages beyond the initial HTTP
request that opens the stream) — SSE is the right tool for a strictly
unidirectional feed. It needs zero new infrastructure: `@Sse()` is built
into `@nestjs/common` and streams an `Observable<MessageEvent>` over plain
HTTP, reusing the exact same `JwtAuthGuard`/`SpaceGuard` as every other REST
route. WebSocket would mean a new NestJS gateway, a new protocol to secure,
and bidirectionality this feature has no use for. GraphQL subscriptions
(`graphql-ws`) would mean adding a second GraphQL transport (the API is
Apollo code-first over plain HTTP today) for the same one-directional need
SSE already covers over REST.

**How it's wired — reusing the aggregate's own event stream.** The
`NotificationAggregate` already applies `NotificationCreatedEvent` /
`NotificationReadEvent` / `NotificationResolvedEvent` through `@nestjs/cqrs`'s
in-process `EventBus` — that's how any CQRS aggregate in this codebase
communicates state changes, SSE or not. A new `NotificationSseForwarderService`
subscribes to that same `EventBus` stream, exactly mirroring how
`DomainEventForwarderService` (the existing Kafka forwarder) already
subscribes to it — same `OnModuleInit`/`eventBus.subscribe()` shape, just a
different sink. For each relevant event it looks up open connections for
`(userId, spaceId)` in `NotificationSseConnectionRegistry` and pushes a
`MessageEvent` to each.

```
NotificationAggregate.create()/markRead()/resolve()
        │ applies event
   EventBus (in-process, @nestjs/cqrs)
        │
        ├─→ (existing) DomainEventForwarderService ──(if KAFKA_ENABLED)──→ Kafka
        │
        └─→ (new) NotificationSseForwarderService
                  │ filters: NotificationCreated | NotificationRead | NotificationResolved
                  │ looks up NotificationSseConnectionRegistry.get(userId, spaceId)
                  └─→ Subject.next(MessageEvent) ──→ every open GET /notifications/stream response for that user
```

`NotificationSseConnectionRegistry` is a per-process singleton:
`Map<string /* "${userId}:${spaceId}" */, Set<Subject<MessageEvent>>>` — a
`Set` (not a single `Subject`) because the same user can have multiple tabs
or devices open at once, each with its own connection.
`GET /notifications/stream` (`@Sse()`, guarded like every other route)
creates a `Subject`, registers it, returns
`merge(subject.asObservable(), heartbeat$)` where `heartbeat$` is an
`interval(20_000)` emitting an SSE comment (`: heartbeat\n\n`, not a `data:`
message — invisible to `EventSource`/`fetch-event-source` consumers) purely
to keep intermediary proxies/load balancers from treating the connection as
idle and closing it. On `req.on('close')` the handler removes its `Subject`
from the registry.

**What SSE is not, in v1.** It's an additive delivery channel for rows that
already exist in Postgres — the database, not the SSE stream, is the source
of truth. A client that was disconnected when a notification was created
still sees it on its next `notificationsFindByCriteria` call; it just didn't
get the instant push. This is why `NotificationFindByCriteriaQuery` /
`NotificationsUnreadCountQuery` are not removed or deprecated by this
addition — SSE and pull-on-demand coexist, and the web side keeps a coarse
polling fallback for exactly this reason (see `notifications-web`'s design).

It's also explicitly **single-instance**: the registry lives in one API
process's memory. If a notification created on instance A needs to reach a
client connected to instance B, nothing forwards them today — see the
"Multi-instance SSE fan-out" risk in the proposal for the documented (not
built) follow-up.

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
| Cross-context integration direction | Each source context (`care-schedule`, `inventory`) owns its own `INotificationDispatcherPort` and pushes into `notifications`' one public `UpsertConditionNotificationCommand` | `notifications`-owned read ports polling both contexts on a central cron (superseded — see "Superseded" above) | Matches the project's port-ownership convention (the context that needs something owns the port); `notifications` ends up with zero read dependencies on domain contexts; resolution becomes instant instead of up-to-15-min-late for the mutation-triggered exit paths |
| Detection split per type | `INVENTORY_LOW_STOCK`: fully event-driven, no cron. `CARE_SCHEDULE_DUE`/`INVENTORY_EXPIRING_SOON`: small per-context cron for entering, mutation-triggered dispatch for exiting | One shared cron in `notifications` for all three (superseded); a cron per type per context doing both directions | Low-stock has a natural mutation trigger for both directions — a cron would just be redundant polling. The other two only have a trigger for exiting; entering unavoidably needs a sweep since nothing mutates when a date arrives |
| Notification granularity | One row per `(dedupeKey, recipient)`; fan-out to all active members | One row per space (shared read state); owner-only recipient | Per-user read state is the correct UX (a notification I read shouldn't still show unread badge to my spouse); fan-out matches the contexts' existing no-ownership-gate model |
| Dedupe/lifecycle | `dedupeKey` + `resolvedAt`; idempotent upsert on every dispatch (create-if-missing / no-op-if-open / resolve-if-open / no-op-if-already-resolved) | Event-sourced trigger key per notification instance; ad-hoc "don't renotify for N hours" cooldown | An idempotent upsert per condition is simple to reason about and safe to call redundantly (a sweep re-affirming, or a handler dispatching on every save regardless of whether the relevant fields changed); a cooldown timer would still show a stale "low stock" after restocking |
| Scheduling mechanism | `@nestjs/schedule` `@Cron()` in each owning context, interval configurable via that context's own env var, default 15 min | `setInterval` in a bootstrap service; external scheduler (e.g. k8s CronJob hitting an internal endpoint); one shared cron in `notifications` (superseded) | `@nestjs/schedule` is the standard, testable NestJS primitive; splitting the cron per context keeps detection logic next to the business rule it depends on |
| Payload shape | `payload: JsonValueObject` (from `@sisques-labs/nestjs-kit`) carrying type-specific, display-ready data (`activityType`, `nextDueAt`, `plantId` / `itemName`, `quantity`, `unit`, `lowStockThreshold` / `itemName`, `expiresAt`) | Fully relational columns per type; no payload, web re-fetches the referenced entity | API stays framework-agnostic of *how* the web renders text (no server-side i18n); avoids an extra round trip per notification row to hydrate an item that may since have changed anyway (payload is a snapshot at creation time, which is desirable) |
| Read/resolved as separate axes | `status: UNREAD \| READ` + `resolvedAt: Date \| null`, independent | Single `status` enum (`UNREAD \| READ \| RESOLVED \| RESOLVED_UNREAD`) | Two orthogonal booleans are simpler to query and reason about than a 4-state enum that conflates them |
| Channel dispatch | `INotificationDispatcherPort` (owned by `notifications`, for a future push/email channel), `NoopNotificationDispatcherAdapter` in v1 | Skip the port entirely, add it when push/email actually lands | User explicitly asked for the seam to exist now; a no-op adapter costs nothing and documents the extension point directly in code. Unrelated to the per-source-context `INotificationDispatcherPort`s described above — same name, opposite direction, easy to confuse, documented in each README |
| Duplicate-row race protection | Partial unique index `(dedupe_key, user_id) WHERE resolved_at IS NULL` | Row-level advisory lock per space during dispatch; rely on application-level check only | Defense in depth against two concurrent dispatches for the same condition (e.g. a mutation and an overlapping sweep both firing `active: true`); a partial index is cheap and Postgres-native |
| Overlapping job runs | In-process re-entrancy guard per cron (skip a tick if the previous sweep is still running) + the partial unique index as a backstop | Distributed lock (Redis/Postgres advisory lock) across instances | v1 runs a single API instance per environment; a cross-instance lock is a real follow-up the moment this is horizontally scaled, called out as a risk, not solved here |
| Real-time transport | Server-Sent Events (`@Sse()`), REST-only | WebSocket gateway; GraphQL subscriptions (`graphql-ws`) | Delivery is strictly server→client, one-directional — SSE is the simplest tool that fits; zero new dependencies (`@Sse()` ships in `@nestjs/common`); avoids standing up a second GraphQL transport or a new WS protocol for a need that doesn't require bidirectionality |
| SSE fan-out mechanism | In-process `NotificationSseConnectionRegistry` fed by a new subscriber (`NotificationSseForwarderService`) on the existing `@nestjs/cqrs` `EventBus` | A second Kafka consumer feeding SSE; Redis pub/sub from day one | Mirrors the already-proven `DomainEventForwarderService` pattern (subscribe to `EventBus`, no aggregate/handler changes); no new infra for the common single-instance case; multi-instance fan-out explicitly deferred (see Risks) rather than solved speculatively |
| SSE keep-alive | `interval(20_000)` heartbeat comment merged into the response stream | Rely on TCP keep-alive alone; shorter/longer interval | 20s is comfortably under typical proxy/load-balancer idle-connection timeouts (commonly 60s+) without adding meaningful bandwidth; a plain SSE comment line is invisible to `EventSource`/`fetch-event-source` message handlers |
| SSE is additive, not authoritative | DB row is the source of truth; SSE only pushes notice of a change that already happened | Make SSE delivery required for a notification to "count" | A disconnected client must still see everything correctly via `NotificationFindByCriteriaQuery` on reconnect/next visit — SSE failure must never lose data, only delay the client's awareness of it |

## Data Flow

### User-facing read path

```
REST/GraphQL/MCP ──(JwtAuthGuard + SpaceGuard)──> Query
        │
   QueryBus ──> NotificationFindByCriteriaQueryHandler ──> ReadRepo(tenant, WHERE space_id AND user_id = current) ──> ViewModel[]
   QueryBus ──> NotificationsUnreadCountQueryHandler    ──> ReadRepo(tenant, WHERE space_id AND user_id = current AND status = UNREAD AND resolved_at IS NULL) ──> count
```

### Real-time push path (SSE)

```
GET /notifications/stream ──(JwtAuthGuard + SpaceGuard)──>
   NotificationsStreamController.stream()
        │ subject = new Subject<MessageEvent>()
        │ NotificationSseConnectionRegistry.register(userId, spaceId, subject)
        │ req.on('close') → registry.deregister(userId, spaceId, subject)
        └─> return merge(subject.asObservable(), heartbeat$)   // @Sse() streams this to the client

 ... independently, any write happens (mark-read, mark-all-read, or a source
     context dispatching UpsertConditionNotificationCommand) ...

NotificationAggregate applies event ──> EventBus
        └─> NotificationSseForwarderService.onModuleInit() subscription
              → for NotificationCreatedEvent / NotificationReadEvent / NotificationResolvedEvent:
                  registry.get(event.userId, event.spaceId)?.forEach(subject => subject.next(toMessageEvent(event)))
```

### User-facing write path

```
REST/GraphQL/MCP ──> MarkNotificationReadCommand(id, requestingUserId)
        │
   CommandBus ──> Handler ──> AssertNotificationExistsService (write repo)
        │              ──> ownership check: aggregate.userId === requestingUserId (else 403)
        │              ──> aggregate.markRead() ──> NotificationReadEvent
        │              ──> save via write repo
```

### Condition dispatch path (push, from the owning context)

```
care-schedule / inventory: a mutation handler saves, or a small per-context
cron detects a newly-due/expiring entity
        │
        ├─ (care-schedule) CareScheduleAggregate.isDueWithin(dueWindowHours)
        │  or (inventory) InventoryItemAggregate.isLowStock() / isExpiringWithin(expiringWindowDays)
        │
        └─ INotificationDispatcherPort.dispatch({ referenceId, payload, active })   // owned by the source context
              │
              ▼ (adapter maps to the target type/referenceType and dispatches on the Command bus)
        UpsertConditionNotificationCommand { type, referenceType, referenceId, payload, active }
              │
   CommandBus ──> UpsertConditionNotificationCommandHandler (notifications)
        │  dedupeKey = NotificationDedupeKeyValueObject.compute(type, referenceId)
        │  open = NotificationReadRepository.findOpenByDedupeKey(dedupeKey)
        │
        ├─ active && open.length === 0  → IUserDirectoryPort.listActiveMemberUserIds() → build + save one NotificationAggregate per member → publish events
        ├─ active && open.length > 0    → no-op
        ├─ !active && open.length > 0   → load each via write repo → resolve() → save → publish events
        └─ !active && open.length === 0 → no-op
```

Per-context detection (for the two calendar-based types), entirely within
the owning context, no cross-context read:

```
care-schedule: @Cron(CARE_SCHEDULE_DUE_RECONCILE_CRON)   // CareScheduleDueReconciliationJob
   ISpaceDirectoryPort.listAllSpaceIds()                 // care-schedule's own copy, → SpaceFindAllIdsQuery
   for each spaceId: SpaceContext.run(spaceId, () =>
     CommandBus.execute(new CheckDueCareSchedulesCommand({ windowHours }))
   )
   → handler queries CareScheduleReadRepository directly (active: true, due_before <= now+window)
     → for each: INotificationDispatcherPort.dispatch({ referenceId, payload, active: true })

inventory: @Cron(INVENTORY_EXPIRING_RECONCILE_CRON)      // InventoryExpiringReconciliationJob
   ISpaceDirectoryPort.listAllSpaceIds()                 // inventory's own copy, → SpaceFindAllIdsQuery
   for each spaceId: SpaceContext.run(spaceId, () =>
     CommandBus.execute(new CheckExpiringInventoryItemsCommand({ windowDays }))
   )
   → handler queries InventoryItemReadRepository directly (expiresAt <= now+window)
     → for each: INotificationDispatcherPort.dispatch({ condition: EXPIRING_SOON, referenceId, payload, active: true })
```

## File Changes

New under `src/contexts/notifications/`:

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
  repositories/read/notification-read.repository.ts           # INotificationReadRepository + token; findOpenByDedupeKey
  repositories/write/notification-write.repository.ts         # INotificationWriteRepository + token; saveMany
  value-objects/notification-id/notification-id.value-object.ts
  value-objects/notification-dedupe-key/notification-dedupe-key.value-object.ts
  value-objects/notification-type/notification-type.value-object.ts
  value-objects/notification-reference-type/notification-reference-type.value-object.ts
  value-objects/notification-payload/notification-payload.value-object.ts    # extends JsonValueObject
  view-models/notification.view-model.ts
application/
  ports/user-directory.port.ts                      # IUserDirectoryPort
  ports/notification-dispatcher.port.ts             # INotificationDispatcherPort (v1 no-op push/email seam)
  services/write/assert-notification-exists/assert-notification-exists.service.ts
  commands/mark-notification-read/mark-notification-read.command.ts
  commands/mark-notification-read/mark-notification-read.handler.ts
  commands/mark-all-notifications-read/mark-all-notifications-read.command.ts
  commands/mark-all-notifications-read/mark-all-notifications-read.handler.ts
  commands/upsert-condition-notification/upsert-condition-notification.command.ts   # the one public entry point for source contexts
  commands/upsert-condition-notification/upsert-condition-notification.handler.ts
  queries/notification-find-by-criteria/notification-find-by-criteria.query.ts
  queries/notification-find-by-criteria/notification-find-by-criteria.handler.ts
  queries/notifications-unread-count/notifications-unread-count.query.ts
  queries/notifications-unread-count/notifications-unread-count.handler.ts
infrastructure/
  adapters/user-directory.adapter.ts                # dispatches UsersFindByCriteriaQuery, paged
  adapters/noop-notification-dispatcher.adapter.ts
  realtime/notification-sse-connection.registry.ts  # in-process Map<"userId:spaceId", Set<Subject<MessageEvent>>>
  realtime/notification-sse-forwarder.service.ts     # subscribes to EventBus, pushes into the registry's subjects
  realtime/notification-sse-event.mapper.ts          # domain event -> MessageEvent (SSE `data:` payload)
  persistence/typeorm/entities/notification.entity.ts
  persistence/typeorm/mappers/notification-typeorm.mapper.ts
  persistence/typeorm/repositories/notification-typeorm-write.repository.ts
  persistence/typeorm/repositories/notification-typeorm-read.repository.ts
transport/
  rest/controllers/notifications.controller.ts
  rest/controllers/notifications-stream.controller.ts  # @Sse() GET /notifications/stream
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

New under `src/contexts/care-schedule/` (the push side for `CARE_SCHEDULE_DUE`):

```
domain/value-objects/care-schedule-due-window-hours/care-schedule-due-window-hours.value-object.ts
application/ports/notification-dispatcher.port.ts       # care-schedule's own INotificationDispatcherPort
application/ports/space-directory.port.ts               # wraps spaces' SpaceFindAllIdsQuery for the sweep
application/commands/check-due-care-schedules/check-due-care-schedules.command.ts   # no transport surface
application/commands/check-due-care-schedules/check-due-care-schedules.handler.ts
infrastructure/adapters/notification-dispatcher.adapter.ts   # dispatches UpsertConditionNotificationCommand
infrastructure/adapters/space-directory.adapter.ts
transport/jobs/care-schedule-due-reconciliation.job.ts   # @Cron; entering-the-window detection only
```

Plus `CareScheduleAggregate.isDueWithin(windowHours)` and a dispatch call
added to `CompleteCareScheduleCommandHandler`,
`UpdateCareScheduleCommandHandler`, `DeleteCareScheduleCommandHandler`
(`WaterPlantCommand` gets this for free via its delegation to
`CompleteCareScheduleCommand`).

New under `src/contexts/inventory/` (the push side for `INVENTORY_LOW_STOCK` /
`INVENTORY_EXPIRING_SOON`):

```
domain/enums/inventory-notification-condition.enum.ts   # LOW_STOCK | EXPIRING_SOON, local to inventory
domain/value-objects/inventory-expiring-window-days/inventory-expiring-window-days.value-object.ts
application/ports/notification-dispatcher.port.ts       # inventory's own INotificationDispatcherPort
application/ports/space-directory.port.ts               # wraps spaces' SpaceFindAllIdsQuery for the sweep
application/commands/check-expiring-inventory-items/check-expiring-inventory-items.command.ts   # no transport surface
application/commands/check-expiring-inventory-items/check-expiring-inventory-items.handler.ts
infrastructure/adapters/notification-dispatcher.adapter.ts   # dispatches UpsertConditionNotificationCommand
infrastructure/adapters/space-directory.adapter.ts
transport/jobs/inventory-expiring-reconciliation.job.ts  # @Cron; expiring-entering detection only, no cron for low-stock
```

Plus `InventoryItemAggregate.isLowStock()` /
`isExpiringWithin(windowDays)` and a dispatch call added to
`AdjustInventoryItemQuantityCommandHandler` (low-stock only),
`UpdateInventoryItemCommandHandler` (both conditions),
`DeleteInventoryItemCommandHandler` /
`DeleteInventoryItemsBulkCommandHandler` (both conditions, unconditionally
`false`).

Plus one addition to the existing `spaces` context:

```
src/contexts/spaces/application/queries/space-find-all-ids/space-find-all-ids.query.ts
src/contexts/spaces/application/queries/space-find-all-ids/space-find-all-ids.handler.ts
```

(No transport files for this query — it is dispatched over `QueryBus` only by
each consuming context's own `SpaceDirectoryAdapter`: `notifications`
originally, now `care-schedule` and `inventory`.)

| File | Action | Description |
|------|--------|--------------|
| `src/database/migrations/1780000000025-CreateNotifications.ts` | Create | `notifications` table, indexes, partial unique index |
| `src/core/core.module.ts` | Modify | Add `ScheduleModule.forRoot()` to `CORE_MODULES`; register `careScheduleConfig`/`inventoryConfig` alongside `notificationsConfig` |
| `src/app.module.ts` | Modify | Register `NotificationsModule` |
| `src/core/config/notifications.config.ts` | Create | `NOTIFICATIONS_SSE_HEARTBEAT_MS` (default `20000`) only — detection windows/cron moved to each owning context |
| `src/core/config/care-schedule.config.ts` | Create | `CARE_SCHEDULE_DUE_WINDOW_HOURS` (default `24`) |
| `src/core/config/inventory.config.ts` | Create | `INVENTORY_EXPIRING_WINDOW_DAYS` (default `7`) |
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

// application/commands/upsert-condition-notification/upsert-condition-notification.command.ts
export type UpsertConditionNotificationCommandInput = Pick<
  INotificationPrimitives,
  'type' | 'referenceType' | 'referenceId' | 'payload'
> & { active: boolean };
export class UpsertConditionNotificationCommand {
  public readonly type: NotificationTypeValueObject;
  public readonly referenceType: NotificationReferenceTypeValueObject;
  public readonly referenceId: UuidValueObject;
  public readonly payload: NotificationPayloadValueObject;
  public readonly active: BooleanValueObject;
  constructor(input: UpsertConditionNotificationCommandInput) { /* wraps each field in its VO */ }
}

// application/ports/user-directory.port.ts
export const USER_DIRECTORY_PORT = Symbol('USER_DIRECTORY_PORT');
export interface IUserDirectoryPort {
  listActiveMemberUserIds(): Promise<string[]>; // reads current SpaceContext
}

// application/ports/notification-dispatcher.port.ts (v1 no-op push/email seam — owned by notifications)
export const NOTIFICATION_DISPATCHER_PORT = Symbol('NOTIFICATION_DISPATCHER_PORT');
export interface INotificationDispatcherPort {
  dispatch(notification: NotificationViewModel): Promise<void>;
}

// care-schedule/application/ports/notification-dispatcher.port.ts (owned by care-schedule — different port, same name)
export const NOTIFICATION_DISPATCHER_PORT = Symbol('NOTIFICATION_DISPATCHER_PORT');
export interface INotificationDispatcherPort {
  dispatch(input: { referenceId: string; payload: Record<string, unknown>; active: boolean }): Promise<void>;
}

// inventory/application/ports/notification-dispatcher.port.ts (owned by inventory — carries a condition discriminator)
export enum InventoryNotificationConditionEnum { LOW_STOCK = 'LOW_STOCK', EXPIRING_SOON = 'EXPIRING_SOON' }
export const NOTIFICATION_DISPATCHER_PORT = Symbol('NOTIFICATION_DISPATCHER_PORT');
export interface INotificationDispatcherPort {
  dispatch(input: {
    condition: InventoryNotificationConditionEnum;
    referenceId: string;
    payload: Record<string, unknown>;
    active: boolean;
  }): Promise<void>;
}

// infrastructure/realtime/notification-sse-connection.registry.ts
@Injectable()
export class NotificationSseConnectionRegistry {
  private readonly connections = new Map<string, Set<Subject<MessageEvent>>>();

  private key(userId: string, spaceId: string): string {
    return `${userId}:${spaceId}`;
  }

  register(userId: string, spaceId: string, subject: Subject<MessageEvent>): void {
    const key = this.key(userId, spaceId);
    if (!this.connections.has(key)) this.connections.set(key, new Set());
    this.connections.get(key)!.add(subject);
  }

  deregister(userId: string, spaceId: string, subject: Subject<MessageEvent>): void {
    const key = this.key(userId, spaceId);
    this.connections.get(key)?.delete(subject);
    if (this.connections.get(key)?.size === 0) this.connections.delete(key);
  }

  publish(userId: string, spaceId: string, event: MessageEvent): void {
    this.connections.get(this.key(userId, spaceId))?.forEach((subject) => subject.next(event));
  }
}

// infrastructure/realtime/notification-sse-forwarder.service.ts
// Same OnModuleInit/eventBus.subscribe() shape as DomainEventForwarderService,
// filtering for this context's three event types and delegating to the registry.
@Injectable()
export class NotificationSseForwarderService implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly registry: NotificationSseConnectionRegistry,
  ) {}
  onModuleInit(): void {
    this.eventBus.subscribe((event: IEvent) => {
      // narrow to NotificationCreatedEvent | NotificationReadEvent | NotificationResolvedEvent,
      // map to a MessageEvent, then:
      // this.registry.publish(event.data.userId, event.data.spaceId, messageEvent)
    });
  }
}

// domain/repositories/read/notification-read.repository.ts
export const NOTIFICATION_READ_REPOSITORY = Symbol('NOTIFICATION_READ_REPOSITORY');
export interface INotificationReadRepository {
  findById(id: string): Promise<NotificationViewModel | null>;
  findByCriteria(userId: string, criteria: Criteria): Promise<PaginatedResult<NotificationViewModel>>;
  countUnread(userId: string): Promise<number>;
  findOpenByDedupeKey(dedupeKey: string): Promise<NotificationViewModel[]>;
}
```

**Entity columns**: `id` (uuid pk), `type` (varchar NOT NULL), `reference_type`
(varchar NOT NULL), `reference_id` (uuid NOT NULL), `dedupe_key` (varchar NOT
NULL), `payload` (jsonb NOT NULL DEFAULT '{}'), `status` (varchar NOT NULL
DEFAULT 'UNREAD'), `read_at` (timestamptz NULL), `resolved_at` (timestamptz
NULL), `user_id` (uuid NOT NULL — the recipient), `space_id` (uuid NOT NULL),
`created_at`, `updated_at`. Indexes: `(space_id, user_id, status)` for the
list/count read path; `(space_id, dedupe_key)` for `findOpenByDedupeKey`;
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
`command.requestingUserId`; mismatch throws `NotificationNotOwnedException`
(403). This mirrors the pattern REST/GraphQL already use elsewhere for
user-scoped (not just space-scoped) resources, and the same
Pick-from-Primitives-plus-an-actor-field shape as `DeletePlantPhotoCommand`.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (`notifications`) | `UpsertConditionNotificationCommandHandler` — all four transitions (create-when-missing + fan-out, no-op-when-already-open, resolve-when-open, no-op-when-nothing-open); aggregate `create`/`markRead` (idempotent)/`resolve` (idempotent) event emission; VOs (`dedupeKey` format, `payload` JSON validity); `NotificationSseConnectionRegistry` — register/deregister/publish, multiple subjects for the same `(userId, spaceId)` all receive a publish, publishing to a key with no registered connections is a silent no-op; `NotificationSseForwarderService` — each of the three event types maps to the expected `MessageEvent` shape and calls `registry.publish` with the event's `userId`/`spaceId`, an unrelated event type is ignored | Jest, `jest.Mocked<T>`, no DB |
| Unit (`care-schedule`) | `CareScheduleAggregate.isDueWithin()` — due/not-due/inactive/window-edge cases; `CheckDueCareSchedulesCommandHandler` — dispatches `active: true` for every due schedule found, paginates, no-ops when none due; each of `Complete`/`Update`/`Delete`CareScheduleCommandHandler — dispatches the recomputed (or unconditional-`false`, for delete) status via the port | Jest, `jest.Mocked<T>`, no DB |
| Unit (`inventory`) | `InventoryItemAggregate.isLowStock()`/`isExpiringWithin()` — threshold/window edge cases, "never true when unset"; `CheckExpiringInventoryItemsCommandHandler` — same shape as care-schedule's; `AdjustInventoryItemQuantityCommandHandler` (low-stock only), `UpdateInventoryItemCommandHandler` (both conditions), `Delete(Bulk)?InventoryItemCommandHandler` (both conditions, unconditional `false`) — each dispatches the recomputed status via the port | Jest, `jest.Mocked<T>`, no DB |
| Integration | Tenant isolation (space A's notifications invisible under space B); `(dedupe_key, user_id) WHERE resolved_at IS NULL` partial unique index actually rejects a duplicate insert; `findOpenByDedupeKey` scopes correctly; `countUnread` excludes resolved | Test DB + `SpaceContext` |
| E2E | Full condition round trip: dispatch `UpsertConditionNotificationCommand` for a due schedule + a low-stock item across two space members → assert 2 notifications × 2 members = 4 rows; dispatch `active: false` for the schedule → assert its 2 rows resolve and the inventory rows are untouched; REST + GraphQL list/unread-count/mark-read/mark-all-read behind guards; mark-read on another user's notification → 403; tenant isolation → 404; **SSE**: open `GET /notifications/stream` with supertest's raw HTTP client, dispatch `MarkNotificationReadCommand` for that user in parallel, assert the stream emits a matching `MessageEvent` within the test timeout; a second connection for a *different* user receives nothing from the first user's events | supertest |
| Static | `notifications-no-cross-context-import.spec.ts`: no import from `@contexts/care-schedule`, `@contexts/inventory`, `@contexts/users`, `@contexts/spaces` outside `notifications/infrastructure/adapters/`. Mirror boundary tests in `care-schedule` and `inventory` now also forbid `@contexts/notifications` outside their own `infrastructure/adapters/` | Jest source scan, mirrors existing boundary tests |

Each cron job (`CareScheduleDueReconciliationJob`,
`InventoryExpiringReconciliationJob`) is intentionally kept as thin as
possible — enumerate spaces, call the command per space, log and continue on
error — so it needs no dedicated test beyond the per-space isolation
behavior already covered by the pattern it mirrors from the superseded
central job.

## Migration / Rollout

Single additive migration `1780000000025`; `down()` drops the `notifications`
table (including its partial unique index) and does not touch any other
table. `spaces`' new `SpaceFindAllIdsQuery` needs no migration (no schema
change). No feature flag gates the push dispatches — they're idempotent
no-ops when nothing has changed, so there's no "cold start" risk from
enabling them; the two per-context crons can be disabled independently via
their own cron env vars if needed during rollout.

## Open Questions

- If/when the API is deployed with more than one instance, the SSE
  connection registry needs a shared backend (Redis pub/sub is the
  lighter-weight option; the existing Kafka forwarder/consumer is the other).
  Not addressed here — flag if multi-instance deployment is already planned
  before this ships, since it changes `NotificationSseConnectionRegistry`
  from an in-process `Map` to a thin wrapper over that shared backend (the
  `register`/`deregister`/`publish` interface can stay the same).
- Configurable per-user windows/mute preferences are explicitly deferred
  (Out of Scope) — flag if product wants this pulled into v1 before
  implementation starts, since it would change the `notifications` table
  shape (a preferences sub-resource) rather than being purely additive later.
- Retention/cleanup of old resolved+read notifications (e.g. a 90-day purge
  job) is not addressed — the table grows unbounded in v1. Acceptable at
  current scale; flagged as a v2 follow-up alongside real push/email.
- The payload for `CARE_SCHEDULE_DUE` carries `plantId`, not a plant name —
  discovered while building `notifications-web`'s message-rendering util.
  Enriching it with a display name would need `care-schedule` to look up the
  plant (a new cross-context read it doesn't have today) — flagged as a
  possible v2 follow-up, not addressed here.
