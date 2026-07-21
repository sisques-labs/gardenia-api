# Tasks: Care Schedule Push Reminders (`care-schedule-push-reminders`)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1 600 – 2 100 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → `notifications` domain + application · PR 2 → `notifications` infrastructure + transport + module wiring · PR 3 → `care-schedule` additions (domain/application/infrastructure/cron) + core wiring · PR 4 → Tests |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | `notifications` domain + application (no I/O) | PR 1 | Aggregate, VOs, events, exceptions, commands, ports |
| 2 | `notifications` infrastructure + transport + module | PR 2 | TypeORM entity/mapper/repos, `WebPushAdapter`, REST/GraphQL/MCP, `NotificationsModule`, migration, README |
| 3 | `care-schedule` additions + core wiring | PR 3 | New VO, `markReminderSent()`, port/adapter, cron, `findDueForReminder`, migration, `ScheduleModule`, env vars |
| 4 | Tests (unit + integration + e2e + static) | PR 4 | All test files across both contexts |

---

## Phase 1: `notifications` — Domain

- [ ] 1.1 Create `src/contexts/notifications/domain/value-objects/push-subscription-id/push-subscription-id.value-object.ts` — extends `UuidValueObject`
- [ ] 1.2 Create `src/contexts/notifications/domain/value-objects/push-subscription-endpoint/push-subscription-endpoint.value-object.ts` — extends `StringValueObject`; rejects empty; max 2000 chars (push endpoints are long URLs)
- [ ] 1.3 Create `src/contexts/notifications/domain/value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object.ts` — extends `StringValueObject`; rejects empty
- [ ] 1.4 Create `src/contexts/notifications/domain/value-objects/push-subscription-auth/push-subscription-auth.value-object.ts` — extends `StringValueObject`; rejects empty
- [ ] 1.5 Create `src/contexts/notifications/domain/events/interfaces/push-subscription-event-data.interface.ts`
- [ ] 1.6 Create `src/contexts/notifications/domain/events/push-subscription-registered/push-subscription-registered.event.ts`
- [ ] 1.7 Create `src/contexts/notifications/domain/events/push-subscription-unregistered/push-subscription-unregistered.event.ts`
- [ ] 1.8 Create `src/contexts/notifications/domain/exceptions/push-subscription-not-found.exception.ts` — HTTP 404
- [ ] 1.9 Create `src/contexts/notifications/domain/interfaces/push-subscription.interface.ts` — `IPushSubscription`, VO-typed fields, `userAgent: StringValueObject | null`
- [ ] 1.10 Create `src/contexts/notifications/domain/primitives/push-subscription.primitives.ts` — `IPushSubscriptionPrimitives extends BasePrimitives`
- [ ] 1.11 Create `src/contexts/notifications/domain/view-models/push-subscription.view-model.ts` — `PushSubscriptionViewModel extends BaseViewModel`
- [ ] 1.12 Create `src/contexts/notifications/domain/repositories/write/push-subscription-write.repository.ts` — `IPushSubscriptionWriteRepository` (+ `findByEndpoint`, `findByUserId`) + `PUSH_SUBSCRIPTION_WRITE_REPOSITORY` token
- [ ] 1.13 Create `src/contexts/notifications/domain/repositories/read/push-subscription-read.repository.ts` — `IPushSubscriptionReadRepository` + `PUSH_SUBSCRIPTION_READ_REPOSITORY` token
- [ ] 1.14 Create `src/contexts/notifications/domain/aggregates/push-subscription.aggregate.ts` — `create()` emits `PushSubscriptionRegisteredEvent`; `updateKeys(p256dh, auth, userAgent)` (no event — internal upsert bookkeeping); `delete()` emits `PushSubscriptionUnregisteredEvent`
- [ ] 1.15 Create `src/contexts/notifications/domain/builders/push-subscription.builder.ts` — extends `BaseBuilder`

---

## Phase 2: `notifications` — Application

- [ ] 2.1 Create `src/contexts/notifications/application/ports/push-payload.interface.ts` — `{ title: string; body: string; url?: string }`
- [ ] 2.2 Create `src/contexts/notifications/application/ports/push-sender.port.ts` — `IPushSenderPort.send(subscription, payload)` + `PUSH_SENDER_PORT` token
- [ ] 2.3 Create `src/contexts/notifications/application/services/write/assert-push-subscription-exists/assert-push-subscription-exists.service.ts`
- [ ] 2.4 Create `src/contexts/notifications/application/commands/register-push-subscription/register-push-subscription.command.ts` — `endpoint`, `p256dh`, `auth`, `userAgent?`; `userId` from `@CurrentUser`
- [ ] 2.5 Create `src/contexts/notifications/application/commands/register-push-subscription/register-push-subscription.handler.ts` — upsert by `findByEndpoint`; update path calls `updateKeys()` + save (no event re-emit); create path builds + `create()` + save
- [ ] 2.6 Create `src/contexts/notifications/application/commands/unregister-push-subscription/unregister-push-subscription.command.ts` — `id`
- [ ] 2.7 Create `src/contexts/notifications/application/commands/unregister-push-subscription/unregister-push-subscription.handler.ts` — loads via assert service; `delete()`; removes; logs
- [ ] 2.8 Create `src/contexts/notifications/application/commands/send-push-notification/send-push-notification.command.ts` — `userId`, `title`, `body`, `url?` — **internal-only, no transport wiring in Phase 4**
- [ ] 2.9 Create `src/contexts/notifications/application/commands/send-push-notification/send-push-notification.handler.ts` — `findByUserId`; empty → no-op; per-subscription `try/catch` around `pushSenderPort.send()`; on error with `statusCode` 404/410 → `commandBus.execute(new UnregisterPushSubscriptionCommand(...))`; log per-subscription outcome

---

## Phase 3: `notifications` — Infrastructure

- [ ] 3.1 Create `src/contexts/notifications/infrastructure/persistence/typeorm/entities/push-subscription.entity.ts` — `push_subscriptions` table; `id` (uuid pk), `user_id` (uuid, `@Index()`), `endpoint` (text, `@Index({ unique: true })`), `p256dh` (varchar 255), `auth` (varchar 255), `user_agent` (varchar 512, NULL), `created_at`, `updated_at`
- [ ] 3.2 Create `src/contexts/notifications/infrastructure/persistence/typeorm/mappers/push-subscription-typeorm.mapper.ts` — `toDomain`/`toPersistence`
- [ ] 3.3 Create `src/contexts/notifications/infrastructure/persistence/typeorm/repositories/push-subscription-typeorm-write.repository.ts` — implements `IPushSubscriptionWriteRepository`; NOT tenant-scoped (no `createTenantRepository`) — plain repository
- [ ] 3.4 Create `src/contexts/notifications/infrastructure/persistence/typeorm/repositories/push-subscription-typeorm-read.repository.ts` — implements `IPushSubscriptionReadRepository`
- [ ] 3.5 Create `src/contexts/notifications/infrastructure/adapters/web-push.adapter.ts` — `WebPushAdapter implements IPushSenderPort`; configures `web-push` with VAPID keys from `ConfigService` in constructor; `send()` calls `webpush.sendNotification(...)`; catches `WebPushError`, rethrows with `.statusCode` preserved for the handler to inspect
- [ ] 3.6 Create `src/database/migrations/1780000000026-CreatePushSubscriptions.ts` — `up()` creates `push_subscriptions` + unique index on `endpoint` + index on `user_id`; `down()` drops table

---

## Phase 4: `notifications` — Transport

- [ ] 4.1 Create `src/contexts/notifications/transport/rest/dtos/register-push-subscription.dto.ts` — `endpoint`, `p256dh`, `auth` required; `userAgent?` optional
- [ ] 4.2 Create `src/contexts/notifications/transport/rest/dtos/push-subscription-rest-response.dto.ts`
- [ ] 4.3 Create `src/contexts/notifications/transport/rest/controllers/push-subscriptions.controller.ts` — `POST /push-subscriptions` (201, `@SkipSpace() @UseGuards(JwtAuthGuard)`), `DELETE /push-subscriptions/:id` (200, same guards); `@CurrentUser` → `userId`; log at each entry point
- [ ] 4.4 Create `src/contexts/notifications/transport/graphql/dtos/requests/register-push-subscription-graphql.dto.ts`
- [ ] 4.5 Create `src/contexts/notifications/transport/graphql/dtos/responses/push-subscription.response.dto.ts`
- [ ] 4.6 Create `src/contexts/notifications/transport/graphql/mappers/push-subscription.mapper.ts`
- [ ] 4.7 Create `src/contexts/notifications/transport/graphql/resolvers/push-subscription-mutations.resolver.ts` — `registerPushSubscription`, `unregisterPushSubscription`; `@SkipSpace()`; dispatches via `CommandBus` only
- [ ] 4.8 Create `src/contexts/notifications/transport/mcp/schemas/push-subscription-register.schema.ts`
- [ ] 4.9 Create `src/contexts/notifications/transport/mcp/schemas/push-subscription-unregister.schema.ts`
- [ ] 4.10 Create `src/contexts/notifications/transport/mcp/tools/push-subscription-register.tool.ts` — wire-level name `push_subscription_register`
- [ ] 4.11 Create `src/contexts/notifications/transport/mcp/tools/push-subscription-unregister.tool.ts` — wire-level name `push_subscription_unregister`
- [ ] 4.12 **Do NOT** create any transport (REST/GraphQL/MCP) for `SendPushNotificationCommand` — confirm this explicitly during review

---

## Phase 5: `notifications` — Module Wiring & Docs

- [ ] 5.1 Create `src/contexts/notifications/notifications.module.ts` — standard provider grouping; `TypeOrmModule.forFeature([PushSubscriptionEntity])`; `CqrsModule` imported
- [ ] 5.2 Modify `src/app.module.ts` — add `NotificationsModule` to `imports[]`
- [ ] 5.3 Create `src/contexts/notifications/README.md` — context walkthrough (commands, guards, MCP tools, the deliberate non-exposure of `SendPushNotificationCommand`), following the auth README template

---

## Phase 6: `care-schedule` — Domain Additions

- [ ] 6.1 Create `src/contexts/care-schedule/domain/value-objects/care-schedule-last-notified-for-due-at/care-schedule-last-notified-for-due-at.value-object.ts` — extends `DateValueObject`
- [ ] 6.2 Modify `src/contexts/care-schedule/domain/interfaces/care-schedule.interface.ts` — add `lastNotifiedForDueAt: CareScheduleLastNotifiedForDueAtValueObject | null`
- [ ] 6.3 Modify `src/contexts/care-schedule/domain/primitives/care-schedule.primitives.ts` — add `lastNotifiedForDueAt: Date | null`
- [ ] 6.4 Modify `src/contexts/care-schedule/domain/aggregates/care-schedule.aggregate.ts` — constructor hydrates `_lastNotifiedForDueAt`; new public method `markReminderSent(notifiedAt: Date): void` (sets VO + `touch()`, no event emitted — see design.md rationale); include in `toPrimitives()` and the getter
- [ ] 6.5 Modify `src/contexts/care-schedule/domain/builders/care-schedule.builder.ts` — `withLastNotifiedForDueAt(value: Date | null)`; thread through `build()`/`buildViewModel()`
- [ ] 6.6 Modify `src/contexts/care-schedule/domain/view-models/care-schedule.view-model.ts` — add `lastNotifiedForDueAt`
- [ ] 6.7 Modify `src/contexts/care-schedule/domain/repositories/write/care-schedule-write.repository.ts` — add `findDueForReminder(now: Date): Promise<CareScheduleAggregate[]>` to `ICareScheduleWriteRepository`

---

## Phase 7: `care-schedule` — Application + Infrastructure Additions

- [ ] 7.1 Create `src/contexts/care-schedule/application/ports/notify-due-care-schedule.input.ts` — `NotifyDueCareScheduleInput { userId, careScheduleId, plantId, activityType }`
- [ ] 7.2 Create `src/contexts/care-schedule/application/ports/notify-due-care-schedule.port.ts` — `INotifyDueCareSchedulePort.notifyDue(input)` + `NOTIFY_DUE_CARE_SCHEDULE_PORT` token
- [ ] 7.3 Create `src/contexts/care-schedule/application/commands/dispatch-due-care-reminders/dispatch-due-care-reminders.command.ts` — no fields (cron-triggered)
- [ ] 7.4 Create `src/contexts/care-schedule/application/commands/dispatch-due-care-reminders/dispatch-due-care-reminders.handler.ts` — `findDueForReminder(new Date())`; for each: `try { await notifyDueCareSchedulePort.notifyDue(...) } catch (e) { log warn, continue }`; then always `schedule.markReminderSent(schedule.nextDueAt.value)` + save; log count dispatched
- [ ] 7.5 Create `src/contexts/care-schedule/infrastructure/adapters/notify-due-care-schedule.adapter.ts` — `NotifyDueCareScheduleAdapter implements INotifyDueCareSchedulePort`; builds title/body; `commandBus.execute(new SendPushNotificationCommand({...}))`
- [ ] 7.6 Create `src/contexts/care-schedule/infrastructure/schedulers/due-care-reminders.scheduler.ts` — `@Injectable()`, `@Cron(CronExpression.EVERY_MINUTE)` method dispatching `DispatchDueCareRemindersCommand` via `CommandBus`; log at each tick (debug level)
- [ ] 7.7 Modify `src/contexts/care-schedule/infrastructure/persistence/typeorm/entities/care-schedule.entity.ts` — add `last_notified_for_due_at` (timestamptz, NULL)
- [ ] 7.8 Modify `src/contexts/care-schedule/infrastructure/persistence/typeorm/mappers/care-schedule-typeorm.mapper.ts` — map new column both directions
- [ ] 7.9 Modify `src/contexts/care-schedule/infrastructure/persistence/typeorm/repositories/care-schedule-typeorm-write.repository.ts` — implement `findDueForReminder(now)` via `QueryBuilder`: `WHERE active = true AND next_due_at <= :now AND (last_notified_for_due_at IS NULL OR last_notified_for_due_at < next_due_at)`
- [ ] 7.10 Create `src/database/migrations/1780000000027-AddLastNotifiedForDueAtToCareSchedules.ts` — `up()` adds nullable column; `down()` drops it
- [ ] 7.11 Modify `src/contexts/care-schedule/care-schedule.module.ts` — register `DispatchDueCareRemindersCommandHandler`, `NOTIFY_DUE_CARE_SCHEDULE_PORT` → `NotifyDueCareScheduleAdapter`, `DueCareRemindersScheduler`

---

## Phase 8: Core Wiring

- [ ] 8.1 Modify `src/core/config/env.validation.ts` — add required, non-empty `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT`
- [ ] 8.2 Modify `src/core/core.module.ts` — add `ScheduleModule.forRoot()` to `CORE_MODULES`
- [ ] 8.3 Modify `package.json` — add `@nestjs/schedule`, `web-push`; add `@types/web-push` to devDependencies
- [ ] 8.4 Modify `src/contexts/care-schedule/README.md` — document the new port/adapter/cron/VO
- [ ] 8.5 Add `.env.example` (or equivalent) entries for the three new VAPID env vars

---

## Phase 9: Tests

- [ ] 9.1 Unit — `push-subscription-endpoint.value-object.spec.ts` / `-p256dh` / `-auth`: non-empty enforced
- [ ] 9.2 Unit — `push-subscription.aggregate.spec.ts`: `create()` emits `PushSubscriptionRegisteredEvent`; `updateKeys()` mutates without emitting; `delete()` emits `PushSubscriptionUnregisteredEvent`
- [ ] 9.3 Unit — `register-push-subscription.handler.spec.ts`: new endpoint → creates + emits; existing endpoint → updates keys, no create event, no duplicate row
- [ ] 9.4 Unit — `unregister-push-subscription.handler.spec.ts`: deletes; not found → 404
- [ ] 9.5 Unit — `send-push-notification.handler.spec.ts`: zero subscriptions → no-op, no error; one throwing + one succeeding → both attempted; error with `statusCode: 410` → dispatches `UnregisterPushSubscriptionCommand`
- [ ] 9.6 Unit — `web-push.adapter.spec.ts`: happy path calls `webpush.sendNotification` with correct VAPID details + payload JSON; library error surfaces `.statusCode`
- [ ] 9.7 Unit — `care-schedule-last-notified-for-due-at.value-object.spec.ts`
- [ ] 9.8 Unit — `care-schedule.aggregate.spec.ts` (extended): `markReminderSent()` sets the field, calls `touch()`, emits no event
- [ ] 9.9 Unit — `dispatch-due-care-reminders.handler.spec.ts`: dispatches notify + marks sent for each due schedule; a notify failure on one schedule does not prevent processing the next, and still marks the failed one as sent (documented trade-off)
- [ ] 9.10 Unit — `notify-due-care-schedule.adapter.spec.ts`: dispatches `SendPushNotificationCommand` with expected payload shape
- [ ] 9.11 Unit — `due-care-reminders.scheduler.spec.ts`: cron callback dispatches `DispatchDueCareRemindersCommand`
- [ ] 9.12 Integration — `push-subscription-typeorm-write.repository.integration-spec.ts`: `findByEndpoint` round-trip; unique constraint violation on duplicate `endpoint` insert bypassing the upsert path; `findByUserId` returns only that user's subscriptions
- [ ] 9.13 Integration — `care-schedule-typeorm-write.repository.integration-spec.ts` (extended): `findDueForReminder` — due+active+unnotified included; inactive excluded; future `nextDueAt` excluded; already-notified-for-current-due-date excluded; notified-for-a-past-due-date-but-now-due-again included
- [ ] 9.14 E2E — `push-subscriptions-rest.e2e-spec.ts`: register/unregister require `JwtAuthGuard` (401 without token) and do NOT require `X-Space-ID`; re-register same endpoint upserts (single row)
- [ ] 9.15 E2E — `push-subscriptions-graphql.e2e-spec.ts`: same via GraphQL mutations
- [ ] 9.16 Static — `notifications-no-cross-context-import.spec.ts`: no import from any other `@contexts/`
- [ ] 9.17 Static — `send-push-notification-not-exposed.spec.ts`: scans `notifications/transport/**` source for any reference to `SendPushNotificationCommand`; fails if found
- [ ] 9.18 Static — extend existing `care-schedule-no-cross-context-import.spec.ts`: `@contexts/notifications` imports appear only under `care-schedule/infrastructure/adapters/`
