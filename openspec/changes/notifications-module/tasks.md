# Tasks: Notifications Module (`notifications-module`)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2 500 – 3 150 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → Domain + Application (incl. reconciliation service) · PR 2 → Infrastructure (persistence + ports/adapters) + migration · PR 3 → `spaces` addition (`SpaceFindAllIdsQuery`) · PR 4 → Transport (REST/GraphQL/MCP) + module wiring + scheduler · PR 5 → Real-time (SSE connection registry + forwarder + stream controller) · PR 6 → Tests |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + reconciliation service (no I/O) | PR 1 | Aggregate, VOs, events, exceptions, commands/queries (incl. internal reconcile command), `NotificationReconciliationService` — fully unit-testable without a DB |
| 2 | Infrastructure: persistence + ports/adapters + migration | PR 2 | TypeORM entity/mapper/repos (tenant), 4 outbound ports + adapters, no-op dispatcher, migration |
| 3 | `spaces` addition | PR 3 | `SpaceFindAllIdsQuery` + handler, README update — small, isolated, safe to land independently |
| 4 | Transport + wiring | PR 4 | REST controller, GraphQL resolvers/DTOs/criteria plumbing, MCP tools, cron job, `NotificationsModule`, `app.module.ts`, `core.module.ts` (`ScheduleModule`), config, `package.json` |
| 5 | Real-time (SSE) | PR 5 | Connection registry, `NotificationSseForwarderService`, `GET /notifications/stream` controller — depends on PR 1 (events) and PR 4 (module wiring), kept separate since it's the one genuinely new mechanism in this change |
| 6 | Tests | PR 6 | Unit, integration, e2e (incl. SSE stream assertions), static boundary test |

---

## Phase 1: Domain

- [x] 1.1 Create `src/contexts/notifications/domain/enums/notification-type.enum.ts` — `NotificationTypeEnum` (`CARE_SCHEDULE_DUE`, `INVENTORY_LOW_STOCK`, `INVENTORY_EXPIRING_SOON`)
- [x] 1.2 Create `src/contexts/notifications/domain/enums/notification-reference-type.enum.ts` — `NotificationReferenceTypeEnum` (`CARE_SCHEDULE`, `INVENTORY_ITEM`)
- [x] 1.3 Create `src/contexts/notifications/domain/enums/notification-status.enum.ts` — `NotificationStatusEnum` (`UNREAD`, `READ`)
- [x] 1.4 Create `src/contexts/notifications/domain/value-objects/notification-id/notification-id.value-object.ts` — extends `UuidValueObject`
- [x] 1.5 Create `src/contexts/notifications/domain/value-objects/notification-type/notification-type.value-object.ts` — extends `EnumValueObject<typeof NotificationTypeEnum>`
- [x] 1.6 Create `src/contexts/notifications/domain/value-objects/notification-reference-type/notification-reference-type.value-object.ts` — extends `EnumValueObject<typeof NotificationReferenceTypeEnum>`
- [x] 1.7 Create `src/contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object.ts` — extends `StringValueObject`; non-empty; format `{type}:{referenceId}`, validated against `NotificationTypeEnum` prefix
- [x] 1.8 Create `src/contexts/notifications/domain/value-objects/notification-payload/notification-payload.value-object.ts` — extends `JsonValueObject`; `allowEmpty: true` (some future type might carry none)
- [x] 1.9 Create `src/contexts/notifications/domain/events/interfaces/notification-event-data.interface.ts`
- [x] 1.10 Create `src/contexts/notifications/domain/events/notification-created/notification-created.event.ts`
- [x] 1.11 Create `src/contexts/notifications/domain/events/notification-read/notification-read.event.ts`
- [x] 1.12 Create `src/contexts/notifications/domain/events/notification-resolved/notification-resolved.event.ts`
- [x] 1.13 Create `src/contexts/notifications/domain/exceptions/notification-not-found.exception.ts` — HTTP 404
- [x] 1.14 Create `src/contexts/notifications/domain/exceptions/notification-not-owned.exception.ts` — HTTP 403
- [x] 1.15 Create `src/contexts/notifications/domain/interfaces/notification.interface.ts` — `INotification` with VO-typed fields
- [x] 1.16 Create `src/contexts/notifications/domain/primitives/notification.primitives.ts` — `INotificationPrimitives extends BasePrimitives`
- [x] 1.17 Create `src/contexts/notifications/domain/view-models/notification.view-model.ts` — `NotificationViewModel extends BaseViewModel`
- [x] 1.18 Create `src/contexts/notifications/domain/repositories/write/notification-write.repository.ts` — `INotificationWriteRepository` (extends `IBaseWriteRepository<NotificationAggregate>`, plus `saveMany(aggregates)`) + `NOTIFICATION_WRITE_REPOSITORY` token
- [x] 1.19 Create `src/contexts/notifications/domain/repositories/read/notification-read.repository.ts` — `INotificationReadRepository` + `NOTIFICATION_READ_REPOSITORY` token; `NotificationCriteria` (`status?`, `type?`, `page?`, `limit?`); `countUnread()`; `findOpenGroupedByDedupeKey()`
- [x] 1.20 Create `src/contexts/notifications/domain/aggregates/notification.aggregate.ts` — `create()` (applies `NotificationCreatedEvent`), `markRead()` (idempotent no-op if already `READ`, else sets `status`/`readAt`, applies `NotificationReadEvent`), `resolve()` (idempotent no-op if `resolvedAt` already set, else sets `resolvedAt`, applies `NotificationResolvedEvent`); no `update()`; carries `userId` (recipient), `spaceId`
- [x] 1.21 Create `src/contexts/notifications/domain/builders/notification.builder.ts` — extends `BaseBuilder`; receives `INotificationPrimitives`; wraps fields in VOs

---

## Phase 2: Application

- [x] 2.1 Create `src/contexts/notifications/application/ports/care-schedule-alerts.port.ts` — `ICareScheduleAlertsPort.findDueWithin(windowHours): Promise<IDueCareSchedule[]>` + `CARE_SCHEDULE_ALERTS_PORT` token; `IDueCareSchedule` in its own file
- [x] 2.2 Create `src/contexts/notifications/application/ports/inventory-alerts.port.ts` — `IInventoryAlertsPort.findLowStock()` / `.findExpiringWithin(windowDays)` + `INVENTORY_ALERTS_PORT` token; `ILowStockItem`/`IExpiringItem` in their own files
- [x] 2.3 Create `src/contexts/notifications/application/ports/user-directory.port.ts` — `IUserDirectoryPort.listActiveMemberUserIds(): Promise<string[]>` + `USER_DIRECTORY_PORT` token
- [x] 2.4 Create `src/contexts/notifications/application/ports/space-directory.port.ts` — `ISpaceDirectoryPort.listAllSpaceIds(): Promise<string[]>` + `SPACE_DIRECTORY_PORT` token
- [x] 2.5 Create `src/contexts/notifications/application/ports/notification-dispatcher.port.ts` — `INotificationDispatcherPort.dispatch(notification): Promise<void>` + `NOTIFICATION_DISPATCHER_PORT` token
- [x] 2.6 Create `src/contexts/notifications/application/services/notification-reconciliation/notification-reconciliation.service.ts` — pure function/class: inputs (due schedules, low-stock items, expiring items, member ids, current open groups by dedupeKey) → `IReconciliationPlan` (`toCreate[]` fanned out per member, `toResolveDedupeKeys[]`); no I/O, no DI beyond plain construction
- [x] 2.7 Create `src/contexts/notifications/application/services/write/assert-notification-exists/assert-notification-exists.service.ts` — loads from write repo; throws `NotificationNotFoundException` when null
- [x] 2.8 Create `src/contexts/notifications/application/commands/mark-notification-read/mark-notification-read.command.ts` — `notificationId`, `userId` (from `@CurrentUser`)
- [x] 2.9 Create `src/contexts/notifications/application/commands/mark-notification-read/mark-notification-read.handler.ts` — loads via assert service; ownership check (`aggregate.userId === command.userId`, else `NotificationNotOwnedException`); calls `markRead()`; saves; logs
- [x] 2.10 Create `src/contexts/notifications/application/commands/mark-all-notifications-read/mark-all-notifications-read.command.ts` — `userId`
- [x] 2.11 Create `src/contexts/notifications/application/commands/mark-all-notifications-read/mark-all-notifications-read.handler.ts` — loads all unread for `userId` in current space via write repo; `markRead()` each; `saveMany`; logs count marked
- [x] 2.12 Create `src/contexts/notifications/application/commands/reconcile-space-notifications/reconcile-space-notifications.command.ts` — no input fields (reads current `SpaceContext`); **no REST/GraphQL/MCP surface**
- [x] 2.13 Create `src/contexts/notifications/application/commands/reconcile-space-notifications/reconcile-space-notifications.handler.ts` — orchestrates: calls all 4 ports + read repo's `findOpenGroupedByDedupeKey()`, builds plan via `NotificationReconciliationService`, persists via write repo (`saveMany` for creates, `saveMany` for resolves), calls `INotificationDispatcherPort.dispatch()` per created notification; logs counts (created/resolved) on completion
- [x] 2.14 Create `src/contexts/notifications/application/queries/notification-find-by-criteria/notification-find-by-criteria.query.ts` — `status?`, `type?`, `page`, `limit`; always carries current `userId`
- [x] 2.15 Create `src/contexts/notifications/application/queries/notification-find-by-criteria/notification-find-by-criteria.handler.ts` — scoped to `spaceId` + `userId`; logs at entry
- [x] 2.16 Create `src/contexts/notifications/application/queries/notifications-unread-count/notifications-unread-count.query.ts`
- [x] 2.17 Create `src/contexts/notifications/application/queries/notifications-unread-count/notifications-unread-count.handler.ts` — scoped to `spaceId` + `userId`; returns `{ count: number }`; logs at entry

---

## Phase 3: Infrastructure

- [x] 3.1 Create `src/contexts/notifications/infrastructure/persistence/typeorm/entities/notification.entity.ts` — `notifications` table; columns per design; `@Index` on `(space_id, user_id, status)` and `(space_id, dedupe_key)`
- [x] 3.2 Create `src/contexts/notifications/infrastructure/persistence/typeorm/mappers/notification-typeorm.mapper.ts` — `toDomain`/`toPersistence`; `payload` stored/read as jsonb (no manual JSON.stringify needed with `jsonb` column type)
- [x] 3.3 Create `src/contexts/notifications/infrastructure/persistence/typeorm/repositories/notification-typeorm-write.repository.ts` — extends `BaseDatabaseRepository`; `createTenantRepository` pattern; implements `INotificationWriteRepository` incl. `saveMany`
- [x] 3.4 Create `src/contexts/notifications/infrastructure/persistence/typeorm/repositories/notification-typeorm-read.repository.ts` — `createTenantRepository` pattern; `findByCriteria` filters by `userId` (always) + `status`/`type`; `countUnread()`; `findOpenGroupedByDedupeKey()` (`WHERE resolved_at IS NULL`, grouped in application code after a plain query — no need for SQL `GROUP BY` since full rows are needed)
- [x] 3.5 Create `src/contexts/notifications/infrastructure/adapters/care-schedule-alerts.adapter.ts` — implements `ICareScheduleAlertsPort`; dispatches `CareScheduleFindByCriteriaQuery({ active: true, dueBefore: now + windowHours })` via `QueryBus`; pages through all results; maps `CareScheduleViewModel[] → IDueCareSchedule[]`
- [x] 3.6 Create `src/contexts/notifications/infrastructure/adapters/inventory-alerts.adapter.ts` — implements `IInventoryAlertsPort`; two methods, each dispatching `InventoryItemFindByCriteriaQuery` with `lowStock: true` or `expiringBefore`; pages through all results; maps view models
- [x] 3.7 Create `src/contexts/notifications/infrastructure/adapters/user-directory.adapter.ts` — implements `IUserDirectoryPort`; dispatches `UsersFindByCriteriaQuery({})` paged (loop until a short page), scoped by ambient `SpaceContext`; maps to `userId[]`
- [x] 3.8 Create `src/contexts/notifications/infrastructure/adapters/space-directory.adapter.ts` — implements `ISpaceDirectoryPort`; dispatches `SpaceFindAllIdsQuery` (new, see Phase 3b) via `QueryBus`
- [x] 3.9 Create `src/contexts/notifications/infrastructure/adapters/noop-notification-dispatcher.adapter.ts` — implements `INotificationDispatcherPort`; logs at debug (`Logger`); documents itself as the phase-2 push/email seam
- [x] 3.10 Create `src/database/migrations/1780000000025-CreateNotifications.ts` — `up()` creates `notifications` table, `IDX_notifications_space_user_status`, `IDX_notifications_space_dedupe_key`, partial unique `UQ_notifications_dedupe_key_user_open ON notifications (dedupe_key, user_id) WHERE resolved_at IS NULL`, FKs to `users`/`spaces` (`ON DELETE CASCADE`); `down()` reverses

### Phase 3b: `spaces` addition (independent, chain first if possible)

- [x] 3b.1 Create `src/contexts/spaces/application/queries/space-find-all-ids/space-find-all-ids.query.ts` — no input fields
- [x] 3b.2 Create `src/contexts/spaces/application/queries/space-find-all-ids/space-find-all-ids.handler.ts` — `SpaceTypeOrmReadRepository` (not tenant-wrapped, same as existing `findById`); returns `string[]`; logs at entry
- [x] 3b.3 Register the new query handler in `src/contexts/spaces/spaces.module.ts` (`QUERY_HANDLERS`)
- [x] 3b.4 Update `src/contexts/spaces/README.md` — document `SpaceFindAllIdsQuery` as internal-only (no transport), consumed by `notifications`

---

## Phase 4: Transport

- [x] 4.1 Create `src/contexts/notifications/transport/rest/dtos/notification-rest-response.dto.ts` — all `NotificationViewModel` fields
- [x] 4.2 Create `src/contexts/notifications/transport/rest/mappers/notification/notification.mapper.ts`
- [x] 4.3 Create `src/contexts/notifications/transport/rest/controllers/notifications.controller.ts` — routes: `GET /notifications` (criteria: `status`, `type`, `page`, `limit`), `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`; guards `JwtAuthGuard` + `SpaceGuard`; `@CurrentUser` → `userId`; log at each entry point
- [x] 4.4 Create `src/contexts/notifications/transport/graphql/enums/notifications-registered-enums.graphql.ts` — register `NotificationTypeEnum`, `NotificationReferenceTypeEnum`, `NotificationStatusEnum`
- [x] 4.5 Create `src/contexts/notifications/transport/graphql/enums/notification-queryable-field.enum.ts` — `NotificationQueryableField` whitelisting `type`, `status` (real columns; `userId`/`spaceId` implicit, excluded)
- [x] 4.6 Create `src/contexts/notifications/transport/graphql/registries/notification-filterable-fields.registry.ts` — `notificationFilterableFields: FilterFieldRegistry<NotificationQueryableField>`; `type` → `{ type: 'enum', enum: NotificationTypeEnum }`; `status` → `{ type: 'enum', enum: NotificationStatusEnum }`; co-located `.spec.ts`
- [x] 4.7 Create `src/contexts/notifications/transport/graphql/dtos/requests/notification-filter.input.ts` / `notification-sort.input.ts` — `createFilterInput`/`createSortInput` per convention
- [x] 4.8 Create `src/contexts/notifications/transport/graphql/dtos/requests/notification-criteria-graphql.dto.ts` — `NotificationFindByCriteriaRequestDto` overriding `filters`/`sorts`
- [x] 4.9 Create `src/contexts/notifications/transport/graphql/dtos/responses/notification.response.dto.ts`
- [x] 4.10 Create `src/contexts/notifications/transport/graphql/mappers/notification.mapper.ts`
- [x] 4.11 Create `src/contexts/notifications/transport/graphql/resolvers/notification-queries.resolver.ts` — `notificationsFindByCriteria` (wired with `FilterValidationPipe(notificationFilterableFields)`), `notificationsUnreadCount`
- [x] 4.12 Create `src/contexts/notifications/transport/graphql/resolvers/notification-mutations.resolver.ts` — `notificationMarkRead`, `notificationsMarkAllRead`
- [x] 4.13 Create `src/contexts/notifications/transport/mcp/schemas/notification-find-by-criteria.schema.ts` + `notification-mark-read.schema.ts` — Zod
- [x] 4.14 Create `src/contexts/notifications/transport/mcp/tools/notification-find-by-criteria.tool.ts`, `notification-unread-count.tool.ts`, `notification-mark-read.tool.ts`, `notification-mark-all-read.tool.ts` — `{Name}McpTool implements IMcpTool<IMcpToolContext>`, snake_case wire names (`notification_find_by_criteria`, `notification_unread_count`, `notification_mark_read`, `notification_mark_all_read`); read `userId`/`spaceId` from injected context only
- [x] 4.15 Create `src/contexts/notifications/transport/jobs/notifications-reconciliation.job.ts` — `@Injectable()` `OnModuleInit`-free `@Cron(cronExpressionFromConfig)`; guarded by `NOTIFICATIONS_RECONCILE_ENABLED`; in-process re-entrancy flag; `ISpaceDirectoryPort.listAllSpaceIds()` then per-space `SpaceContext.run(id, () => commandBus.execute(new ReconcileSpaceNotificationsCommand()))` wrapped in try/catch (log & continue); logs start/completion with counts
- [x] 4.16 Create `src/core/config/notifications.config.ts` — `NOTIFICATIONS_RECONCILE_ENABLED` (bool, default `true`, forced `false` in test env config), `NOTIFICATIONS_RECONCILE_CRON` (default `*/15 * * * *`), `NOTIFICATIONS_CARE_SCHEDULE_DUE_WINDOW_HOURS` (default `24`), `NOTIFICATIONS_INVENTORY_EXPIRING_WINDOW_DAYS` (default `7`)
- [x] 4.17 Create `src/contexts/notifications/notifications.module.ts` — grouped provider arrays (`COMMAND_HANDLERS`, `QUERY_HANDLERS`, `APPLICATION_SERVICES`, `DOMAIN_BUILDERS`, `INFRASTRUCTURE_REPOSITORIES`, `INFRASTRUCTURE_MAPPERS`, `INFRASTRUCTURE_ENTITIES`, `TRANSPORT_PROVIDERS`, `MCP_TOOLS`); imports `CqrsModule`
- [x] 4.18 Modify `src/core/core.module.ts` — add `ScheduleModule.forRoot()` to `CORE_MODULES`, load `notificationsConfig`
- [x] 4.19 Modify `src/app.module.ts` — register `NotificationsModule`
- [x] 4.20 Modify `package.json` — add `@nestjs/schedule`
- [x] 4.21 Create `src/contexts/notifications/README.md` — context walkthrough, using `auth`'s README as the reference template, explicitly documenting the reconciliation model and the internal-only `ReconcileSpaceNotificationsCommand`

---

## Phase 5: Real-time (SSE)

- [x] 5.1 Create `src/contexts/notifications/infrastructure/realtime/notification-sse-connection.registry.ts` — `NotificationSseConnectionRegistry`: `register(userId, spaceId, subject)`, `deregister(userId, spaceId, subject)`, `publish(userId, spaceId, event)`; `Map<"userId:spaceId", Set<Subject<MessageEvent>>>`; `@Injectable()` singleton (default NestJS provider scope — one instance per process)
- [x] 5.2 Create `src/contexts/notifications/infrastructure/realtime/notification-sse-event.mapper.ts` — maps `NotificationCreatedEvent | NotificationReadEvent | NotificationResolvedEvent` to a `MessageEvent` (`{ type: 'notification-created' | 'notification-read' | 'notification-resolved', data: {...} }`)
- [x] 5.3 Create `src/contexts/notifications/infrastructure/realtime/notification-sse-forwarder.service.ts` — `NotificationSseForwarderService implements OnModuleInit`; same `eventBus.subscribe()` shape as `DomainEventForwarderService` (nestjs-kit messaging), filters the three event types via the mapper, calls `registry.publish(event.data.userId, event.data.spaceId, mapped)`; logs a warning (not an error) if a mapped event has no `userId`/`spaceId` (should be unreachable, defensive)
- [x] 5.4 Create `src/contexts/notifications/transport/rest/controllers/notifications-stream.controller.ts` — `GET /notifications/stream`, `@Sse()`, guards `JwtAuthGuard` + `SpaceGuard`; creates a `Subject<MessageEvent>`, registers it with `(userId, spaceId)`, returns `merge(subject.asObservable(), interval(NOTIFICATIONS_SSE_HEARTBEAT_MS).pipe(map(() => ({ type: 'heartbeat', data: '' } as MessageEvent))))`; `req.on('close', () => registry.deregister(userId, spaceId, subject))`; logs connect/disconnect at entry
- [x] 5.5 Add `NOTIFICATIONS_SSE_HEARTBEAT_MS` (default `20000`) to `src/core/config/notifications.config.ts`
- [x] 5.6 Register `NotificationSseConnectionRegistry`, `NotificationSseForwarderService`, and the new controller in `notifications.module.ts`'s provider arrays

---

## Phase 6: Tests

- [x] 6.1 Unit — `NotificationReconciliationService`: create-when-missing, no-op-when-open-exists, resolve-when-condition-cleared, multi-member fan-out, mixed types in one pass, empty-everything no-op
- [x] 6.2 Unit — `NotificationAggregate`: `create`/`markRead` (incl. idempotent no-op)/`resolve` (incl. idempotent no-op) event emission
- [x] 6.3 Unit — VOs: `NotificationDedupeKeyValueObject` format validation (dedicated spec); `NotificationTypeValueObject`/`NotificationReferenceTypeValueObject` invalid-value rejection covered indirectly via aggregate/builder specs (thin `EnumValueObject` wrappers, no dedicated spec files)
- [x] 6.4 Unit — handlers: `MarkNotificationReadCommandHandler` happy path + not-owned (403, via mocked assert service) — not-found itself is `AssertNotificationExistsService`'s own concern, not re-tested here; `MarkAllNotificationsReadCommandHandler` happy path + no-op; `ReconcileSpaceNotificationsCommandHandler` (mocked ports) happy path + empty-everything no-op; query handlers happy path + empty list
- [ ] 6.5 Unit — each adapter: dispatches the expected query with expected args (mocked `QueryBus`), maps the result shape correctly, pages through multiple pages — **not done in this session**, see state.yaml
- [ ] 6.6 Unit — `NotificationsReconciliationJob`: iterates all space ids from the port; one space throwing is logged and does not stop the loop; no-ops entirely when `NOTIFICATIONS_RECONCILE_ENABLED=false` — **not done in this session**, see state.yaml
- [x] 6.7 Unit — `NotificationSseConnectionRegistry`: register then publish delivers to that subject; multiple subjects for the same `(userId, spaceId)` all receive a publish; deregistering one subject leaves others receiving; publish to an unregistered key is a no-op (no throw); registry entry is removed once its subject set is empty
- [x] 6.8 Unit — `NotificationSseForwarderService`: each of `NotificationCreatedEvent`/`NotificationReadEvent` is mapped and published to the event's own `userId`/`spaceId`; an unrelated event is ignored, not forwarded
- [ ] 6.9 Integration — tenant isolation; partial unique index behavior; `findOpenGroupedByDedupeKey` grouping; `countUnread` — **not run in this session, no Postgres/Docker available in this environment**
- [ ] 6.10 Integration — `SpaceFindAllIdsQuery` returns all spaces regardless of active `SpaceContext` — **not run, no DB available**
- [ ] 6.11 E2E — full reconciliation round trip — **not run, no DB available**
- [ ] 6.12 E2E — REST + GraphQL — **not run, no DB available**
- [ ] 6.13 E2E — SSE stream — **not run, no DB available**
- [x] 6.14 Static — `notifications-no-cross-context-import.spec.ts`: no import from another bounded context outside `infrastructure/adapters/` (mirrors `care-schedule`'s boundary test pattern)
