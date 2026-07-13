# Proposal: Notifications Module (`notifications`)

## Intent

Two bounded contexts already compute the exact signals a gardener needs to act
on, but nothing surfaces them: `care-schedule` tracks `nextDueAt` per plant
care plan (with an index built expressly to serve "what's due in this space"),
and `inventory` already exposes `lowStock` and `expiringBefore` query filters.
Today a user only sees these facts if they happen to open the right screen and
read the right field. There is no "you have 2 pending waterings" or "seeds are
low" moment.

This change introduces a **tenant-scoped `notifications` bounded context**
that periodically reconciles the state of `care-schedule` and `inventory`
into a persisted, per-user, in-app notification feed: unread/read state,
list/count endpoints, and mark-as-read. It does **not** integrate a push or
email provider yet — v1 is in-app only — but the notification-creation path
is deliberately seamed behind a dispatcher port so a later change can add
real channels without touching the domain or the reconciliation engine.

Both source contexts stay completely unaware that `notifications` exists:
`notifications` reads them exclusively through its own read-only ports over
`QueryBus`, the same anti-corruption pattern already used by `spaces →
weather` and `plants → qr`. No event bus, no Kafka — the existing
`MessagingModule` Kafka forwarder is opt-in and disabled by default in every
environment today (`KAFKA_ENABLED=false`), so building this feature's core
loop on it would make the reminder engine depend on standing up a broker.
Polling on a schedule keeps v1 self-contained and is the same mechanism a
future push channel needs anyway (push requires a proactive job regardless of
whether the transport is polling or eventing).

## Scope

### In Scope

- New `notifications` bounded context: domain → application → infrastructure
  → transport, tenant-scoped via `SpaceContext`, following the project's
  DDD+CQRS+Hexagonal layering.
- `NotificationAggregate`: one row per **(condition instance, recipient)** —
  see Design for the dedupe/resolve model that prevents the same due schedule
  or low-stock item from spamming a new row every reconciliation cycle.
- Three notification types in v1: `CARE_SCHEDULE_DUE`, `INVENTORY_LOW_STOCK`,
  `INVENTORY_EXPIRING_SOON`. The enum is designed to extend cleanly (new type
  = new enum member + one new reconciliation source, no shape change).
- A scheduled reconciliation job (`@nestjs/schedule`, new dependency) that,
  for every space, queries `care-schedule` (schedules due within a
  configurable window) and `inventory` (`lowStock: true`, and
  `expiringBefore` within a configurable window) via read-only ports, fans
  out one notification per active space member per open condition, and
  resolves notifications whose underlying condition has cleared (schedule
  completed, item restocked above threshold, item deleted).
- Commands: `MarkNotificationReadCommand`, `MarkAllNotificationsReadCommand`
  — public, user-facing. `ReconcileSpaceNotificationsCommand` — internal,
  dispatched exclusively by the reconciliation job, no REST/GraphQL/MCP
  surface.
- Queries: `NotificationFindByCriteriaQuery` (filters: `status`, `type`,
  paginated, always scoped to the current user within the current space),
  `NotificationsUnreadCountQuery`.
- Dual transport (REST + GraphQL) for the public commands/queries, plus MCP
  tools per the repo convention.
- `INotificationDispatcherPort` with a `NoopNotificationDispatcherAdapter` in
  v1 (logs only) — the seam a phase-2 change plugs a push/email adapter into.
  No external provider is integrated in this change.
- One small addition to the existing `spaces` context: `SpaceFindAllIdsQuery`
  — the reconciliation job needs to enumerate every space to sweep; nothing
  today lists all spaces (every existing query is scoped to a user or a
  single space). System-only, no REST/GraphQL/MCP surface.
- Register `NotificationsModule` in `src/app.module.ts`; register
  `ScheduleModule.forRoot()` in `src/core/core.module.ts`.
- TypeORM entity + migration for `notifications`, tenant-scoped.
- Tests at all applicable layers per `openspec/config.yaml`.

### Out of Scope (explicit)

- **Real push/email delivery.** No FCM/APNs/web-push/SMTP integration. The
  dispatcher port exists; only the no-op adapter ships.
- **Dismiss/archive** as a status distinct from read/unread. v1 has exactly
  two user-facing states (`UNREAD`, `READ`) plus a system-managed `resolvedAt`
  (see Design) that hides a notification once its condition clears,
  independent of whether the user ever read it.
- **User-configurable notification preferences** (mute a type, change the
  due-soon window per user, quiet hours). Windows are space-wide config in
  v1.
- **Weather-triggered alerts** (frost warning vs. unprotected outdoor plants)
  — flagged in the original brainstorm as a good v2 candidate; needs its own
  design (weather forecasts aren't polled per-space today) and is left for a
  follow-up change.
- **Kafka-based/event-driven cross-context wiring.** Explicitly rejected for
  v1 — see Intent and Design's rejected alternatives.
- Real-time delivery (WebSocket/SSE push to an open browser tab). v1 is
  pull-based (the web client polls/queries on demand); real-time is a
  reasonable phase-2 addition once a channel exists to justify it.
- Per-adjustment inventory ledger, sowing calendars, or any other
  already-deferred inventory/care-schedule scope — untouched by this change.

## Capabilities

### New Capabilities

- `notifications`: tenant-scoped, per-user in-app notification feed
  reconciled from `care-schedule` and `inventory` state; list, unread count,
  mark-read, mark-all-read.

### Modified Capabilities

- `spaces`: adds `SpaceFindAllIdsQuery` (system/internal use only — no
  transport surface, no behavior change to any existing public API).

## Approach

- **No cross-context coupling in either direction beyond ports.**
  `care-schedule` and `inventory` are not modified and do not import or know
  about `notifications`. `notifications` never imports their
  domain/application — it depends on `ICareScheduleAlertsPort` /
  `IInventoryAlertsPort` interfaces it owns, backed by adapters in
  `notifications/infrastructure/adapters/` that dispatch those contexts'
  existing public `FindByCriteriaQuery`s over `QueryBus`.
- **Recipients via existing API, not a new one.** Fan-out targets every
  active member of the space, resolved through the `users` context's
  existing `usersFindByCriteria` (already the sanctioned way to list a
  space's members, per the `resolve-space-members-via-memberships` change) —
  wrapped behind `notifications`' own `IUserDirectoryPort`.
- **Polling, not eventing, for v1.** A `@nestjs/schedule` cron job runs the
  reconciliation on a fixed interval (default 15 min, configurable). Kafka
  forwarding stays exactly as it is today (opt-in, disabled by default) and
  is not a dependency of this feature; if the app later turns
  `KAFKA_ENABLED=true` for other reasons, that's orthogonal.
- **Dedupe/resolve via a natural key, not an event trigger key.** Every
  condition instance (a specific schedule being due, a specific item being
  low/expiring) maps to a `dedupeKey`. The reconciliation command is
  idempotent: re-running it never creates a duplicate open notification for a
  condition that's still open, and it closes (`resolvedAt`) notifications
  whose condition cleared since the last run.
- **Best-effort, isolated per space.** One space's reconciliation failure
  (bad data, a transient query error) is logged and skipped; it must not
  abort the sweep for other spaces — mirrors the existing best-effort
  philosophy already documented on the Kafka forwarder.

## Affected Areas

| Area | Impact | Description |
|------|--------|--------------|
| `src/contexts/notifications/` | New | Full bounded context |
| `src/contexts/spaces/application/queries/space-find-all-ids/` | New | Internal-only query, no transport |
| `src/database/migrations/<next>-CreateNotifications.ts` | New | `notifications` table + indexes |
| `src/core/core.module.ts` | Modified | Register `ScheduleModule.forRoot()` |
| `src/app.module.ts` | Modified | Register `NotificationsModule` |
| `package.json` | Modified | Add `@nestjs/schedule` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Reconciliation job scales poorly as spaces/schedules grow (N spaces × M schedules × K members per cycle) | Med | v1 accepts sequential-per-space sweep with a bounded 15 min interval; existing `(space_id, active, next_due_at)` and inventory indexes already make each space's queries cheap; documented as a scaling follow-up (batching/partitioning across job instances) if space count grows large |
| Duplicate notification rows from a race between two overlapping reconciliation runs (job overrun) | Low | Partial unique index on `(dedupe_key, user_id) WHERE resolved_at IS NULL` at the DB level, on top of the application-level check; job also guards against overlap with a simple in-process "already running" flag |
| Fan-out to every member is noisy for large spaces | Low | Product decision, documented as a rejected alternative (owner-only) in Design; acceptable for the household/allotment-sized spaces this product targets today |
| New `@nestjs/schedule` dependency running in every environment (including tests) fires unwanted cron ticks | Low | Job is guarded by an env flag (`NOTIFICATIONS_RECONCILE_ENABLED`, default `true`, forced `false` in the test config) mirroring the `KAFKA_ENABLED` opt-in pattern |
| Migration timestamp conflict | Low | Confirmed against current highest migration before implementation |

## Rollback Plan

Revert branch; run migration `down()` (drops `notifications` table and the
partial unique index). `spaces`' new `SpaceFindAllIdsQuery` is additive and
has no callers outside `notifications`, so it can be reverted independently
with zero blast radius. No data migration in other tables.

## Dependencies

- New: `@nestjs/schedule` (^4, standard NestJS cron package).
- Reuses `JwtAuthGuard`, `SpaceGuard`, `createTenantRepository`,
  `BaseAggregate`/`BaseBuilder`, `JsonValueObject`, `EnumValueObject` from
  `@sisques-labs/nestjs-kit`.
- Reuses existing public queries: `CareScheduleFindByCriteriaQuery`,
  `InventoryItemFindByCriteriaQuery`, `UsersFindByCriteriaQuery`.

## Success Criteria

- [ ] A care schedule whose `nextDueAt` falls inside the configured window
      produces exactly one open `CARE_SCHEDULE_DUE` notification per active
      space member; completing the schedule resolves it within one
      reconciliation cycle.
- [ ] An inventory item crossing into `lowStock` produces exactly one open
      `INVENTORY_LOW_STOCK` notification per active space member; restocking
      above the threshold resolves it within one cycle.
- [ ] An inventory item entering the configured expiry window produces
      exactly one open `INVENTORY_EXPIRING_SOON` notification per active
      space member; the same item never produces a second open notification
      while the condition persists across repeated cycles.
- [ ] `notificationsFindByCriteria` / `notificationsUnreadCount` only ever
      return the authenticated user's own notifications, scoped to the
      active space.
- [ ] Marking a notification read is idempotent and rejects marking another
      user's notification.
- [ ] `care-schedule` and `inventory` have zero new imports from or
      references to `notifications`.
- [ ] `pnpm test` / `pnpm test:integration` / `pnpm test:e2e` green;
      `pnpm lint` and `tsc --noEmit` clean.
