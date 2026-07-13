# Tasks: Notifications Module (`notifications-module`)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2 200 – 2 800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → Domain + Application (incl. reconciliation service) · PR 2 → Infrastructure (persistence + ports/adapters) + migration · PR 3 → `spaces` addition (`SpaceFindAllIdsQuery`) · PR 4 → Transport (REST/GraphQL/MCP) + module wiring + scheduler · PR 5 → Tests |
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
| 5 | Tests | PR 5 | Unit, integration, e2e, static boundary test |

---

## Phase 1: Domain

- [ ] 1.1 Create `src/contexts/notifications/domain/enums/notification-type.enum.ts` — `NotificationTypeEnum` (`CARE_SCHEDULE_DUE`, `INVENTORY_LOW_STOCK`, `INVENTORY_EXPIRING_SOON`)
- [ ] 1.2 Create `src/contexts/notifications/domain/enums/notification-reference-type.enum.ts` — `NotificationReferenceTypeEnum` (`CARE_SCHEDULE`, `INVENTORY_ITEM`)
- [ ] 1.3 Create `src/contexts/notifications/domain/enums/notification-status.enum.ts` — `NotificationStatusEnum` (`UNREAD`, `READ`)
- [ ] 1.4 Create `src/contexts/notifications/domain/value-objects/notification-id/notification-id.value-object.ts` — extends `UuidValueObject`
- [ ] 1.5 Create `src/contexts/notifications/domain/value-objects/notification-type/notification-type.value-object.ts` — extends `EnumValueObject<typeof NotificationTypeEnum>`
- [ ] 1.6 Create `src/contexts/notifications/domain/value-objects/notification-reference-type/notification-reference-type.value-object.ts` — extends `EnumValueObject<typeof NotificationReferenceTypeEnum>`
- [ ] 1.7 Create `src/contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object.ts` — extends `StringValueObject`; non-empty; format `{type}:{referenceId}`, validated against `NotificationTypeEnum` prefix
- [ ] 1.8 Create `src/contexts/notifications/domain/value-objects/notification-payload/notification-payload.value-object.ts` — extends `JsonValueObject`; `allowEmpty: true` (some future type might carry none)
- [ ] 1.9 Create `src/contexts/notifications/domain/events/interfaces/notification-event-data.interface.ts`
- [ ] 1.10 Create `src/contexts/notifications/domain/events/notification-created/notification-created.event.ts`
- [ ] 1.11 Create `src/contexts/notifications/domain/events/notification-read/notification-read.event.ts`
- [ ] 1.12 Create `src/contexts/notifications/domain/events/notification-resolved/notification-resolved.event.ts`
- [ ] 1.13 Create `src/contexts/notifications/domain/exceptions/notification-not-found.exception.ts` — HTTP 404
- [ ] 1.14 Create `src/contexts/notifications/domain/exceptions/notification-not-owned.exception.ts` — HTTP 403
- [ ] 1.15 Create `src/contexts/notifications/domain/interfaces/notification.interface.ts` — `INotification` with VO-typed fields
- [ ] 1.16 Create `src/contexts/notifications/domain/primitives/notification.primitives.ts` — `INotificationPrimitives extends BasePrimitives`
- [ ] 1.17 Create `src/contexts/notifications/domain/view-models/notification.view-model.ts` — `NotificationViewModel extends BaseViewModel`
- [ ] 1.18 Create `src/contexts/notifications/domain/repositories/write/notification-write.repository.ts` — `INotificationWriteRepository` (extends `IBaseWriteRepository<NotificationAggregate>`, plus `saveMany(aggregates)`) + `NOTIFICATION_WRITE_REPOSITORY` token
- [ ] 1.19 Create `src/contexts/notifications/domain/repositories/read/notification-read.repository.ts` — `INotificationReadRepository` + `NOTIFICATION_READ_REPOSITORY` token; `NotificationCriteria` (`status?`, `type?`, `page?`, `limit?`); `countUnread()`; `findOpenGroupedByDedupeKey()`
- [ ] 1.20 Create `src/contexts/notifications/domain/aggregates/notification.aggregate.ts` — `create()` (applies `NotificationCreatedEvent`), `markRead()` (idempotent no-op if already `READ`, else sets `status`/`readAt`, applies `NotificationReadEvent`), `resolve()` (idempotent no-op if `resolvedAt` already set, else sets `resolvedAt`, applies `NotificationResolvedEvent`); no `update()`; carries `userId` (recipient), `spaceId`
- [ ] 1.21 Create `src/contexts/notifications/domain/builders/notification.builder.ts` — extends `BaseBuilder`; receives `INotificationPrimitives`; wraps fields in VOs

---

## Phase 2: Application

- [ ] 2.1 Create `src/contexts/notifications/application/ports/care-schedule-alerts.port.ts` — `ICareScheduleAlertsPort.findDueWithin(windowHours): Promise<IDueCareSchedule[]>` + `CARE_SCHEDULE_ALERTS_PORT` token; `IDueCareSchedule` in its own file
- [ ] 2.2 Create `src/contexts/notifications/application/ports/inventory-alerts.port.ts` — `IInventoryAlertsPort.findLowStock()` / `.findExpiringWithin(windowDays)` + `INVENTORY_ALERTS_PORT` token; `ILowStockItem`/`IExpiringItem` in their own files
- [ ] 2.3 Create `src/contexts/notifications/application/ports/user-directory.port.ts` — `IUserDirectoryPort.listActiveMemberUserIds(): Promise<string[]>` + `USER_DIRECTORY_PORT` token
- [ ] 2.4 Create `src/contexts/notifications/application/ports/space-directory.port.ts` — `ISpaceDirectoryPort.listAllSpaceIds(): Promise<string[]>` + `SPACE_DIRECTORY_PORT` token
- [ ] 2.5 Create `src/contexts/notifications/application/ports/notification-dispatcher.port.ts` — `INotificationDispatcherPort.dispatch(notification): Promise<void>` + `NOTIFICATION_DISPATCHER_PORT` token
- [ ] 2.6 Create `src/contexts/notifications/application/services/notification-reconciliation/notification-reconciliation.service.ts` — pure function/class: inputs (due schedules, low-stock items, expiring items, member ids, current open groups by dedupeKey) → `IReconciliationPlan` (`toCreate[]` fanned out per member, `toResolveDedupeKeys[]`); no I/O, no DI beyond plain construction
- [ ] 2.7 Create `src/contexts/notifications/application/services/write/assert-notification-exists/assert-notification-exists.service.ts` — loads from write repo; throws `NotificationNotFoundException` when null
- [ ] 2.8 Create `src/contexts/notifications/application/commands/mark-notification-read/mark-notification-read.command.ts` — `notificationId`, `userId` (from `@CurrentUser`)
- [ ] 2.9 Create `src/contexts/notifications/application/commands/mark-notification-read/mark-notification-read.handler.ts` — loads via assert service; ownership check (`aggregate.userId === command.userId`, else `NotificationNotOwnedException`); calls `markRead()`; saves; logs
- [ ] 2.10 Create `src/contexts/notifications/application/commands/mark-all-notifications-read/mark-all-notifications-read.command.ts` — `userId`
- [ ] 2.11 Create `src/contexts/notifications/application/commands/mark-all-notifications-read/mark-all-notifications-read.handler.ts` — loads all unread for `userId` in current space via write repo; `markRead()` each; `saveMany`; logs count marked
- [ ] 2.12 Create `src/contexts/notifications/application/commands/reconcile-space-notifications/reconcile-space-notifications.command.ts` — no input fields (reads current `SpaceContext`); **no REST/GraphQL/MCP surface**
- [ ] 2.13 Create `src/contexts/notifications/application/commands/reconcile-space-notifications/reconcile-space-notifications.handler.ts` — orchestrates: calls all 4 ports + read repo's `findOpenGroupedByDedupeKey()`, builds plan via `NotificationReconciliationService`, persists via write repo (`saveMany` for creates, `saveMany` for resolves), calls `INotificationDispatcherPort.dispatch()` per created notification; logs counts (created/resolved) on completion
- [ ] 2.14 Create `src/contexts/notifications/application/queries/notification-find-by-criteria/notification-find-by-criteria.query.ts` — `status?`, `type?`, `page`, `limit`; always carries current `userId`
- [ ] 2.15 Create `src/contexts/notifications/application/queries/notification-find-by-criteria/notification-find-by-criteria.handler.ts` — scoped to `spaceId` + `userId`; logs at entry
- [ ] 2.16 Create `src/contexts/notifications/application/queries/notifications-unread-count/notifications-unread-count.query.ts`
- [ ] 2.17 Create `src/contexts/notifications/application/queries/notifications-unread-count/notifications-unread-count.handler.ts` — scoped to `spaceId` + `userId`; returns `{ count: number }`; logs at entry

---

## Phase 3: Infrastructure

- [ ] 3.1 Create `src/contexts/notifications/infrastructure/persistence/typeorm/entities/notification.entity.ts` — `notifications` table; columns per design; `@Index` on `(space_id, user_id, status)` and `(space_id, dedupe_key)`
- [ ] 3.2 Create `src/contexts/notifications/infrastructure/persistence/typeorm/mappers/notification-typeorm.mapper.ts` — `toDomain`/`toPersistence`; `payload` stored/read as jsonb (no manual JSON.stringify needed with `jsonb` column type)
- [ ] 3.3 Create `src/contexts/notifications/infrastructure/persistence/typeorm/repositories/notification-typeorm-write.repository.ts` — extends `BaseDatabaseRepository`; `createTenantRepository` pattern; implements `INotificationWriteRepository` incl. `saveMany`
- [ ] 3.4 Create `src/contexts/notifications/infrastructure/persistence/typeorm/repositories/notification-typeorm-read.repository.ts` — `createTenantRepository` pattern; `findByCriteria` filters by `userId` (always) + `status`/`type`; `countUnread()`; `findOpenGroupedByDedupeKey()` (`WHERE resolved_at IS NULL`, grouped in application code after a plain query — no need for SQL `GROUP BY` since full rows are needed)
- [ ] 3.5 Create `src/contexts/notifications/infrastructure/adapters/care-schedule-alerts.adapter.ts` — implements `ICareScheduleAlertsPort`; dispatches `CareScheduleFindByCriteriaQuery({ active: true, dueBefore: now + windowHours })` via `QueryBus`; pages through all results; maps `CareScheduleViewModel[] → IDueCareSchedule[]`
- [ ] 3.6 Create `src/contexts/notifications/infrastructure/adapters/inventory-alerts.adapter.ts` — implements `IInventoryAlertsPort`; two methods, each dispatching `InventoryItemFindByCriteriaQuery` with `lowStock: true` or `expiringBefore`; pages through all results; maps view models
- [ ] 3.7 Create `src/contexts/notifications/infrastructure/adapters/user-directory.adapter.ts` — implements `IUserDirectoryPort`; dispatches `UsersFindByCriteriaQuery({})` paged (loop until a short page), scoped by ambient `SpaceContext`; maps to `userId[]`
- [ ] 3.8 Create `src/contexts/notifications/infrastructure/adapters/space-directory.adapter.ts` — implements `ISpaceDirectoryPort`; dispatches `SpaceFindAllIdsQuery` (new, see Phase 3b) via `QueryBus`
- [ ] 3.9 Create `src/contexts/notifications/infrastructure/adapters/noop-notification-dispatcher.adapter.ts` — implements `INotificationDispatcherPort`; logs at debug (`Logger`); documents itself as the phase-2 push/email seam
- [ ] 3.10 Create `src/database/migrations/1780000000025-CreateNotifications.ts` — `up()` creates `notifications` table, `IDX_notifications_space_user_status`, `IDX_notifications_space_dedupe_key`, partial unique `UQ_notifications_dedupe_key_user_open ON notifications (dedupe_key, user_id) WHERE resolved_at IS NULL`, FKs to `users`/`spaces` (`ON DELETE CASCADE`); `down()` reverses

### Phase 3b: `spaces` addition (independent, chain first if possible)

- [ ] 3b.1 Create `src/contexts/spaces/application/queries/space-find-all-ids/space-find-all-ids.query.ts` — no input fields
- [ ] 3b.2 Create `src/contexts/spaces/application/queries/space-find-all-ids/space-find-all-ids.handler.ts` — `SpaceTypeOrmReadRepository` (not tenant-wrapped, same as existing `findById`); returns `string[]`; logs at entry
- [ ] 3b.3 Register the new query handler in `src/contexts/spaces/spaces.module.ts` (`QUERY_HANDLERS`)
- [ ] 3b.4 Update `src/contexts/spaces/README.md` — document `SpaceFindAllIdsQuery` as internal-only (no transport), consumed by `notifications`

---

## Phase 4: Transport

- [ ] 4.1 Create `src/contexts/notifications/transport/rest/dtos/notification-rest-response.dto.ts` — all `NotificationViewModel` fields
- [ ] 4.2 Create `src/contexts/notifications/transport/rest/mappers/notification/notification.mapper.ts`
- [ ] 4.3 Create `src/contexts/notifications/transport/rest/controllers/notifications.controller.ts` — routes: `GET /notifications` (criteria: `status`, `type`, `page`, `limit`), `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`; guards `JwtAuthGuard` + `SpaceGuard`; `@CurrentUser` → `userId`; log at each entry point
- [ ] 4.4 Create `src/contexts/notifications/transport/graphql/enums/notifications-registered-enums.graphql.ts` — register `NotificationTypeEnum`, `NotificationReferenceTypeEnum`, `NotificationStatusEnum`
- [ ] 4.5 Create `src/contexts/notifications/transport/graphql/enums/notification-queryable-field.enum.ts` — `NotificationQueryableField` whitelisting `type`, `status` (real columns; `userId`/`spaceId` implicit, excluded)
- [ ] 4.6 Create `src/contexts/notifications/transport/graphql/registries/notification-filterable-fields.registry.ts` — `notificationFilterableFields: FilterFieldRegistry<NotificationQueryableField>`; `type` → `{ type: 'enum', enum: NotificationTypeEnum }`; `status` → `{ type: 'enum', enum: NotificationStatusEnum }`; co-located `.spec.ts`
- [ ] 4.7 Create `src/contexts/notifications/transport/graphql/dtos/requests/notification-filter.input.ts` / `notification-sort.input.ts` — `createFilterInput`/`createSortInput` per convention
- [ ] 4.8 Create `src/contexts/notifications/transport/graphql/dtos/requests/notification-criteria-graphql.dto.ts` — `NotificationFindByCriteriaRequestDto` overriding `filters`/`sorts`
- [ ] 4.9 Create `src/contexts/notifications/transport/graphql/dtos/responses/notification.response.dto.ts`
- [ ] 4.10 Create `src/contexts/notifications/transport/graphql/mappers/notification.mapper.ts`
- [ ] 4.11 Create `src/contexts/notifications/transport/graphql/resolvers/notification-queries.resolver.ts` — `notificationsFindByCriteria` (wired with `FilterValidationPipe(notificationFilterableFields)`), `notificationsUnreadCount`
- [ ] 4.12 Create `src/contexts/notifications/transport/graphql/resolvers/notification-mutations.resolver.ts` — `notificationMarkRead`, `notificationsMarkAllRead`
- [ ] 4.13 Create `src/contexts/notifications/transport/mcp/schemas/notification-find-by-criteria.schema.ts` + `notification-mark-read.schema.ts` — Zod
- [ ] 4.14 Create `src/contexts/notifications/transport/mcp/tools/notification-find-by-criteria.tool.ts`, `notification-unread-count.tool.ts`, `notification-mark-read.tool.ts`, `notification-mark-all-read.tool.ts` — `{Name}McpTool implements IMcpTool<IMcpToolContext>`, snake_case wire names (`notification_find_by_criteria`, `notification_unread_count`, `notification_mark_read`, `notification_mark_all_read`); read `userId`/`spaceId` from injected context only
- [ ] 4.15 Create `src/contexts/notifications/transport/jobs/notifications-reconciliation.job.ts` — `@Injectable()` `OnModuleInit`-free `@Cron(cronExpressionFromConfig)`; guarded by `NOTIFICATIONS_RECONCILE_ENABLED`; in-process re-entrancy flag; `ISpaceDirectoryPort.listAllSpaceIds()` then per-space `SpaceContext.run(id, () => commandBus.execute(new ReconcileSpaceNotificationsCommand()))` wrapped in try/catch (log & continue); logs start/completion with counts
- [ ] 4.16 Create `src/core/config/notifications.config.ts` — `NOTIFICATIONS_RECONCILE_ENABLED` (bool, default `true`, forced `false` in test env config), `NOTIFICATIONS_RECONCILE_CRON` (default `*/15 * * * *`), `NOTIFICATIONS_CARE_SCHEDULE_DUE_WINDOW_HOURS` (default `24`), `NOTIFICATIONS_INVENTORY_EXPIRING_WINDOW_DAYS` (default `7`)
- [ ] 4.17 Create `src/contexts/notifications/notifications.module.ts` — grouped provider arrays (`COMMAND_HANDLERS`, `QUERY_HANDLERS`, `APPLICATION_SERVICES`, `DOMAIN_BUILDERS`, `INFRASTRUCTURE_REPOSITORIES`, `INFRASTRUCTURE_MAPPERS`, `INFRASTRUCTURE_ENTITIES`, `TRANSPORT_PROVIDERS`, `MCP_TOOLS`); imports `CqrsModule`
- [ ] 4.18 Modify `src/core/core.module.ts` — add `ScheduleModule.forRoot()` to `CORE_MODULES`, load `notificationsConfig`
- [ ] 4.19 Modify `src/app.module.ts` — register `NotificationsModule`
- [ ] 4.20 Modify `package.json` — add `@nestjs/schedule`
- [ ] 4.21 Create `src/contexts/notifications/README.md` — context walkthrough, using `auth`'s README as the reference template, explicitly documenting the reconciliation model and the internal-only `ReconcileSpaceNotificationsCommand`

---

## Phase 5: Tests

- [ ] 5.1 Unit — `NotificationReconciliationService`: create-when-missing, no-op-when-open-exists, resolve-when-condition-cleared, multi-member fan-out, mixed types in one pass, empty-everything no-op
- [ ] 5.2 Unit — `NotificationAggregate`: `create`/`markRead` (incl. idempotent no-op)/`resolve` (incl. idempotent no-op) event emission
- [ ] 5.3 Unit — VOs: `NotificationDedupeKeyValueObject` format validation; `NotificationTypeValueObject`/`NotificationReferenceTypeValueObject` invalid-value rejection
- [ ] 5.4 Unit — handlers: `MarkNotificationReadCommandHandler` happy path + not-found + not-owned (403); `MarkAllNotificationsReadCommandHandler`; `ReconcileSpaceNotificationsCommandHandler` (mocked ports) happy path + one port throwing doesn't corrupt partial state; query handlers happy path + empty list
- [ ] 5.5 Unit — each adapter: dispatches the expected query with expected args (mocked `QueryBus`), maps the result shape correctly, pages through multiple pages
- [ ] 5.6 Unit — `NotificationsReconciliationJob`: iterates all space ids from the port; one space throwing is logged and does not stop the loop; no-ops entirely when `NOTIFICATIONS_RECONCILE_ENABLED=false`
- [ ] 5.7 Integration — tenant isolation (space A's notifications invisible under space B); partial unique index rejects a duplicate `(dedupe_key, user_id)` insert while `resolved_at IS NULL`, allows a new insert after the prior row is resolved; `findOpenGroupedByDedupeKey` grouping; `countUnread` excludes resolved and read rows correctly per their own axis
- [ ] 5.8 Integration — `SpaceFindAllIdsQuery` returns all spaces regardless of active `SpaceContext`
- [ ] 5.9 E2E — full reconciliation round trip via direct command dispatch: due schedule + low-stock item + 2 members → 4 notification rows; complete the schedule → re-run → `CARE_SCHEDULE_DUE` rows resolved, `INVENTORY_LOW_STOCK` rows untouched; restock the item above threshold → re-run → those rows resolved too
- [ ] 5.10 E2E — REST + GraphQL: list with `status`/`type` filters, unread-count, mark-read (incl. 403 on another user's notification, 404 on unknown id), mark-all-read; all behind `JwtAuthGuard` + `SpaceGuard`
- [ ] 5.11 Static — `notifications-no-cross-context-import.spec.ts`: no import from `@contexts/care-schedule/{domain,application}`, `@contexts/inventory/{domain,application}`, `@contexts/users/{domain,application}`, `@contexts/spaces/{domain,application}` outside `notifications/infrastructure/adapters/`
