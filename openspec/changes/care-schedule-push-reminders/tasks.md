# Tasks: Care Schedule Push Reminders (`care-schedule-push-reminders`)

> Revision 2 — Redis/BullMQ delayed jobs, no cron. Supersedes the previous
> task list (which included a `@Cron` scheduler, `lastNotifiedForDueAt`, and
> `findDueForReminder` — all removed in this revision).

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1 500 – 1 950 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → `notifications` domain + application · PR 2 → `notifications` infrastructure + transport (incl. BullMQ processor) + module wiring · PR 3 → `care-schedule` port/adapter + 4 handler extensions + core/docker wiring · PR 4 → Tests |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | `notifications` domain + application (no I/O) | PR 1 | Aggregate, VOs, events, exceptions, commands, ports |
| 2 | `notifications` infrastructure + transport + module | PR 2 | TypeORM entity/mapper/repos, `WebPushAdapter`, REST/GraphQL/MCP, `PushNotificationsProcessor`, `NotificationsModule`, migration, README |
| 3 | `care-schedule` port/adapter + handler extensions + core/docker wiring | PR 3 | New port, adapter, 4 handler edits, `BullModule` wiring in core + care-schedule module, docker-compose Redis, env vars |
| 4 | Tests (unit + integration + e2e + static) | PR 4 | All test files across both contexts |

---

## Phase 1: `notifications` — Domain

- [ ] 1.1 Create `src/contexts/notifications/domain/value-objects/push-subscription-id/push-subscription-id.value-object.ts` — extends `UuidValueObject`
- [ ] 1.2 Create `src/contexts/notifications/domain/value-objects/push-subscription-endpoint/push-subscription-endpoint.value-object.ts` — extends `StringValueObject`; rejects empty; max 2000 chars
- [ ] 1.3 Create `src/contexts/notifications/domain/value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object.ts` — extends `StringValueObject`; rejects empty
- [ ] 1.4 Create `src/contexts/notifications/domain/value-objects/push-subscription-auth/push-subscription-auth.value-object.ts` — extends `StringValueObject`; rejects empty
- [ ] 1.5 Create `src/contexts/notifications/domain/events/interfaces/push-subscription-event-data.interface.ts`
- [ ] 1.6 Create `src/contexts/notifications/domain/events/push-subscription-registered/push-subscription-registered.event.ts`
- [ ] 1.7 Create `src/contexts/notifications/domain/events/push-subscription-unregistered/push-subscription-unregistered.event.ts`
- [ ] 1.8 Create `src/contexts/notifications/domain/exceptions/push-subscription-not-found.exception.ts` — HTTP 404
- [ ] 1.9 Create `src/contexts/notifications/domain/interfaces/push-subscription.interface.ts` — `IPushSubscription`, VO-typed fields, `userAgent: StringValueObject | null`
- [ ] 1.10 Create `src/contexts/notifications/domain/primitives/push-subscription.primitives.ts`
- [ ] 1.11 Create `src/contexts/notifications/domain/view-models/push-subscription.view-model.ts`
- [ ] 1.12 Create `src/contexts/notifications/domain/repositories/write/push-subscription-write.repository.ts` — `IPushSubscriptionWriteRepository` (+ `findByEndpoint`, `findByUserId`) + `PUSH_SUBSCRIPTION_WRITE_REPOSITORY` token
- [ ] 1.13 Create `src/contexts/notifications/domain/repositories/read/push-subscription-read.repository.ts` — `IPushSubscriptionReadRepository` + `PUSH_SUBSCRIPTION_READ_REPOSITORY` token
- [ ] 1.14 Create `src/contexts/notifications/domain/aggregates/push-subscription.aggregate.ts` — `create()` emits `PushSubscriptionRegisteredEvent`; `updateKeys(p256dh, auth, userAgent)` (no event); `delete()` emits `PushSubscriptionUnregisteredEvent`
- [ ] 1.15 Create `src/contexts/notifications/domain/builders/push-subscription.builder.ts`

---

## Phase 2: `notifications` — Application

- [ ] 2.1 Create `src/contexts/notifications/application/ports/push-payload.interface.ts` — `{ title: string; body: string; url?: string }`
- [ ] 2.2 Create `src/contexts/notifications/application/ports/push-sender.port.ts` — `IPushSenderPort.send(subscription, payload)` + `PUSH_SENDER_PORT` token
- [ ] 2.3 Create `src/contexts/notifications/application/services/write/assert-push-subscription-exists/assert-push-subscription-exists.service.ts`
- [ ] 2.4 Create `src/contexts/notifications/application/commands/register-push-subscription/register-push-subscription.command.ts`
- [ ] 2.5 Create `src/contexts/notifications/application/commands/register-push-subscription/register-push-subscription.handler.ts` — upsert by `findByEndpoint`
- [ ] 2.6 Create `src/contexts/notifications/application/commands/unregister-push-subscription/unregister-push-subscription.command.ts`
- [ ] 2.7 Create `src/contexts/notifications/application/commands/unregister-push-subscription/unregister-push-subscription.handler.ts`
- [ ] 2.8 Create `src/contexts/notifications/application/commands/send-push-notification/send-push-notification.command.ts` — `userId`, `title`, `body`, `url?` — **internal-only**
- [ ] 2.9 Create `src/contexts/notifications/application/commands/send-push-notification/send-push-notification.handler.ts` — per-subscription `try/catch`; `404`/`410` → dispatches `UnregisterPushSubscriptionCommand`

---

## Phase 3: `notifications` — Infrastructure

- [ ] 3.1 Create `src/contexts/notifications/infrastructure/persistence/typeorm/entities/push-subscription.entity.ts` — `push_subscriptions` table; unique index on `endpoint`; index on `user_id`
- [ ] 3.2 Create `src/contexts/notifications/infrastructure/persistence/typeorm/mappers/push-subscription-typeorm.mapper.ts`
- [ ] 3.3 Create `src/contexts/notifications/infrastructure/persistence/typeorm/repositories/push-subscription-typeorm-write.repository.ts` — NOT tenant-scoped
- [ ] 3.4 Create `src/contexts/notifications/infrastructure/persistence/typeorm/repositories/push-subscription-typeorm-read.repository.ts`
- [ ] 3.5 Create `src/contexts/notifications/infrastructure/adapters/web-push.adapter.ts` — `WebPushAdapter implements IPushSenderPort`; VAPID config from `ConfigService`; preserves `.statusCode` on thrown errors
- [ ] 3.6 Create `src/database/migrations/1780000000026-CreatePushSubscriptions.ts`

---

## Phase 4: `notifications` — Transport

- [ ] 4.1 Create `src/contexts/notifications/transport/rest/dtos/register-push-subscription.dto.ts`
- [ ] 4.2 Create `src/contexts/notifications/transport/rest/dtos/push-subscription-rest-response.dto.ts`
- [ ] 4.3 Create `src/contexts/notifications/transport/rest/controllers/push-subscriptions.controller.ts` — `POST /push-subscriptions` (201), `DELETE /push-subscriptions/:id` (200); both `@SkipSpace() @UseGuards(JwtAuthGuard)`
- [ ] 4.4 Create `src/contexts/notifications/transport/graphql/dtos/requests/register-push-subscription-graphql.dto.ts`
- [ ] 4.5 Create `src/contexts/notifications/transport/graphql/dtos/responses/push-subscription.response.dto.ts`
- [ ] 4.6 Create `src/contexts/notifications/transport/graphql/mappers/push-subscription.mapper.ts`
- [ ] 4.7 Create `src/contexts/notifications/transport/graphql/resolvers/push-subscription-mutations.resolver.ts` — `@SkipSpace()`; `CommandBus` only
- [ ] 4.8 Create `src/contexts/notifications/transport/mcp/schemas/push-subscription-register.schema.ts`
- [ ] 4.9 Create `src/contexts/notifications/transport/mcp/schemas/push-subscription-unregister.schema.ts`
- [ ] 4.10 Create `src/contexts/notifications/transport/mcp/tools/push-subscription-register.tool.ts` — `push_subscription_register`
- [ ] 4.11 Create `src/contexts/notifications/transport/mcp/tools/push-subscription-unregister.tool.ts` — `push_subscription_unregister`
- [ ] 4.12 Create `src/contexts/notifications/transport/queues/push-notifications.processor.ts` — `@Processor('push-notifications') extends WorkerHost`; `process(job)` dispatches `SendPushNotificationCommand` via `CommandBus`
- [ ] 4.13 **Do NOT** create any REST/GraphQL/MCP transport for `SendPushNotificationCommand` — confirm explicitly during review; the processor in 4.12 is its only caller

---

## Phase 5: `notifications` — Module Wiring & Docs

- [ ] 5.1 Create `src/contexts/notifications/notifications.module.ts` — standard provider grouping; `BullModule.registerQueue({ name: 'push-notifications', defaultJobOptions: { removeOnComplete: true, removeOnFail: true } })`; `PushNotificationsProcessor` in providers; `TypeOrmModule.forFeature([PushSubscriptionEntity])`; `CqrsModule` imported
- [ ] 5.2 Modify `src/app.module.ts` — add `NotificationsModule` to `imports[]`
- [ ] 5.3 Create `src/contexts/notifications/README.md` — context walkthrough incl. the queue-based processor and the deliberate non-exposure of `SendPushNotificationCommand`

---

## Phase 6: `care-schedule` — Port + Adapter

- [ ] 6.1 Create `src/contexts/care-schedule/application/ports/schedule-reminder.input.ts` — `ScheduleReminderInput { careScheduleId, userId, plantId, activityType, dueAt }`
- [ ] 6.2 Create `src/contexts/care-schedule/application/ports/reminder-scheduler.port.ts` — `IReminderSchedulerPort.scheduleReminder(input)` / `.cancelReminder(careScheduleId)` + `REMINDER_SCHEDULER_PORT` token
- [ ] 6.3 Create `src/contexts/care-schedule/infrastructure/adapters/reminder-queue.adapter.ts` — `ReminderQueueAdapter implements IReminderSchedulerPort`; injects `@InjectQueue('push-notifications') queue: Queue`; `scheduleReminder` removes any existing job for `jobId` then adds the new one with computed `delay` (clamped at 0); builds the plain payload object (no cross-context type import)

---

## Phase 7: `care-schedule` — Handler Extensions

- [ ] 7.1 Modify `src/contexts/care-schedule/application/commands/create-care-schedule/create-care-schedule.handler.ts` — inject `REMINDER_SCHEDULER_PORT`; after successful save, if `schedule.active.value`, call `scheduleReminder({...})` in `try/catch` (log + swallow on failure)
- [ ] 7.2 Modify `src/contexts/care-schedule/application/commands/complete-care-schedule/complete-care-schedule.handler.ts` — inject `REMINDER_SCHEDULER_PORT`; after `complete()` + save, if still `active`, call `scheduleReminder` with the new `nextDueAt`; else call `cancelReminder`; both in `try/catch`
- [ ] 7.3 Modify `src/contexts/care-schedule/application/commands/update-care-schedule/update-care-schedule.handler.ts` — inject `REMINDER_SCHEDULER_PORT`; capture `active` before calling `update()`; if it flips `true→false` call `cancelReminder`; if `false→true` call `scheduleReminder` with current `nextDueAt`; both in `try/catch`
- [ ] 7.4 Modify `src/contexts/care-schedule/application/commands/delete-care-schedule/delete-care-schedule.handler.ts` — inject `REMINDER_SCHEDULER_PORT`; call `cancelReminder` in `try/catch`
- [ ] 7.5 Modify `src/contexts/care-schedule/care-schedule.module.ts` — `BullModule.registerQueue({ name: 'push-notifications' })` (producer only, no processor here); bind `REMINDER_SCHEDULER_PORT` → `ReminderQueueAdapter`

---

## Phase 8: Core + Docker Wiring

- [ ] 8.1 Modify `src/core/config/env.validation.ts` — add required `REDIS_HOST`, `REDIS_PORT`; `REDIS_PASSWORD` optional; required, non-empty `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT`
- [ ] 8.2 Modify `src/core/core.module.ts` — add `BullModule.forRootAsync({ inject: [ConfigService], useFactory: ... })` to `CORE_MODULES`
- [ ] 8.3 Modify `package.json` — add `@nestjs/bullmq`, `bullmq`, `web-push`; add `@types/web-push` to devDependencies
- [ ] 8.4 Modify `docker-compose.yml` — add a `redis` service (`redis:7-alpine`, port `6379`, healthcheck)
- [ ] 8.5 Modify `docker-compose.test.yml` — add a `redis-test` service for integration tests
- [ ] 8.6 Modify `src/contexts/care-schedule/README.md` — document the new port/adapter/queue interaction
- [ ] 8.7 Add `.env.example` (or equivalent) entries for the new Redis + VAPID env vars
- [ ] 8.8 (Optional) Add a Redis ping check to `src/core/health/`

---

## Phase 9: Tests

- [ ] 9.1 Unit — `push-subscription-endpoint.value-object.spec.ts` / `-p256dh` / `-auth`
- [ ] 9.2 Unit — `push-subscription.aggregate.spec.ts`: `create()`/`updateKeys()`/`delete()` event behaviour
- [ ] 9.3 Unit — `register-push-subscription.handler.spec.ts`: create vs. upsert-update paths
- [ ] 9.4 Unit — `unregister-push-subscription.handler.spec.ts`: deletes; not found → 404
- [ ] 9.5 Unit — `send-push-notification.handler.spec.ts`: no-op on zero subscriptions; one failing + one succeeding both attempted; `410` → unregister dispatched
- [ ] 9.6 Unit — `web-push.adapter.spec.ts`: happy path + error `.statusCode` propagation
- [ ] 9.7 Unit — `push-notifications.processor.spec.ts`: `process(job)` dispatches `SendPushNotificationCommand` with the job's data
- [ ] 9.8 Unit — `reminder-queue.adapter.spec.ts`: `scheduleReminder` removes-then-adds with correct `jobId`/`delay` (incl. clamping a past `dueAt` to `0`); `cancelReminder` no-ops when no job exists
- [ ] 9.9 Unit — `create-care-schedule.handler.spec.ts` (extend): calls `scheduleReminder` on success; a port failure doesn't fail the create
- [ ] 9.10 Unit — `complete-care-schedule.handler.spec.ts` (extend): recurring → `scheduleReminder` with new `nextDueAt`; one-time → `cancelReminder`
- [ ] 9.11 Unit — `update-care-schedule.handler.spec.ts` (extend): `active` toggling both directions; no-op when `active` unchanged
- [ ] 9.12 Unit — `delete-care-schedule.handler.spec.ts` (extend): calls `cancelReminder`
- [ ] 9.13 Integration — `push-subscription-typeorm-write.repository.integration-spec.ts`: `findByEndpoint`/`findByUserId`, unique constraint
- [ ] 9.14 Integration — `reminder-queue.adapter.integration-spec.ts`: real Redis; short-delay job becomes available after its delay elapses; replacing a job by id leaves exactly one job
- [ ] 9.15 E2E — `push-subscriptions-rest.e2e-spec.ts` / `push-subscriptions-graphql.e2e-spec.ts`: register/unregister, `JwtAuthGuard` only, upsert behaviour
- [ ] 9.16 E2E — `care-schedule-reminders.e2e-spec.ts`: create → job appears in queue with correct `jobId`/`delay`; complete early → old job replaced, not duplicated; delete → job removed
- [ ] 9.17 Static — `notifications-no-cross-context-import.spec.ts`
- [ ] 9.18 Static — `send-push-notification-not-exposed.spec.ts`: scans `notifications/transport/rest/**`, `transport/graphql/**`, `transport/mcp/**` (excludes `transport/queues/**`) for `SendPushNotificationCommand` references
- [ ] 9.19 Static — extend `care-schedule-no-cross-context-import.spec.ts`: no `@contexts/notifications` import anywhere in `care-schedule` (the adapter needs none in this design)
