# Care Schedule — Due reminder dispatch (delta)

**Source change:** care-schedule-push-reminders
**Created:** 2026-07-21

This is a delta spec against the existing `care-schedule` capability
(originally specified in the `care-schedule` change). It adds reminder
tracking and dispatch on top of the existing aggregate/commands — it does
not restate requirements unaffected by this change (create/update/delete/
complete semantics are unchanged).

---

## Requirements

### Requirement: lastNotifiedForDueAt Field

The `CareScheduleAggregate` MUST carry an additional optional field
`lastNotifiedForDueAt` (Date, nullable). It defaults to `null` on creation
and is never set by `create()` or `update()` — only by `markReminderSent()`.

#### Scenario: New schedule has no notification history

- GIVEN a newly created care schedule
- WHEN it is built
- THEN `lastNotifiedForDueAt` is `null`

---

### Requirement: markReminderSent Method

`CareScheduleAggregate.markReminderSent(notifiedAt: Date)` MUST set
`lastNotifiedForDueAt` to `notifiedAt` and update `updatedAt`. It MUST NOT
emit a domain event (this is delivery bookkeeping, not a user-facing state
transition).

#### Scenario: Marking sent updates the field only

- GIVEN a care schedule with `lastNotifiedForDueAt = null`
- WHEN `markReminderSent(schedule.nextDueAt)` is called
- THEN `lastNotifiedForDueAt` equals the schedule's `nextDueAt` at the time of the call, and no new domain event is recorded

---

### Requirement: findDueForReminder Query (internal)

The write repository MUST expose `findDueForReminder(now: Date)`, returning
every `CareScheduleAggregate` where:
- `active` is `true`, AND
- `nextDueAt <= now`, AND
- `lastNotifiedForDueAt` is `NULL` OR `lastNotifiedForDueAt < nextDueAt`

This is an internal, fixed-shape query with no client-facing filters — it is
NOT subject to the repo's mandatory `findByCriteria`/Criteria-pattern rule,
which applies only to client-choosable `{context}sFindByCriteria` endpoints.

#### Scenario: Due, active, unnotified schedule is included

- GIVEN a schedule with `active=true`, `nextDueAt` in the past, `lastNotifiedForDueAt=null`
- WHEN `findDueForReminder(now)` is called
- THEN the schedule is included

#### Scenario: Inactive schedule excluded

- GIVEN a schedule with `active=false` and `nextDueAt` in the past
- WHEN `findDueForReminder(now)` is called
- THEN the schedule is excluded

#### Scenario: Future due date excluded

- GIVEN a schedule with `nextDueAt` in the future
- WHEN `findDueForReminder(now)` is called
- THEN the schedule is excluded

#### Scenario: Already notified for the current due date excluded

- GIVEN a schedule with `nextDueAt = T` and `lastNotifiedForDueAt = T`
- WHEN `findDueForReminder(now)` is called with `now >= T`
- THEN the schedule is excluded

#### Scenario: Notified for a past due date, now due again, is included

- GIVEN a schedule with `lastNotifiedForDueAt = T1` and a new `nextDueAt = T2 > T1` that is now `<= now`
- WHEN `findDueForReminder(now)` is called
- THEN the schedule is included

---

### Requirement: DispatchDueCareReminders Command

`DispatchDueCareRemindersCommand` takes no input. Its handler MUST:
1. Call `findDueForReminder(now)`.
2. For each returned schedule, call `INotifyDueCareSchedulePort.notifyDue()`
   with the schedule's `userId`, `id`, `plantId`, and `activityType`.
3. Regardless of whether step 2 succeeded or threw, call
   `schedule.markReminderSent(schedule.nextDueAt.value)` and persist the
   schedule.
4. Continue processing remaining due schedules even if one schedule's
   `notifyDue()` call throws.

This command is triggered exclusively by an internal `@Cron(EVERY_MINUTE)`
job — it has no REST/GraphQL/MCP transport of its own (it is not
user-facing).

#### Scenario: Due schedule is notified and marked

- GIVEN one due, active, unnotified schedule
- WHEN `DispatchDueCareReminders` is dispatched
- THEN `notifyDue()` is called once with that schedule's data, and `lastNotifiedForDueAt` is updated to its `nextDueAt`

#### Scenario: One failing notification does not block others

- GIVEN two due schedules, where notifying the first throws
- WHEN `DispatchDueCareReminders` is dispatched
- THEN the second schedule is still notified and marked, and the first schedule is still marked (not retried indefinitely)

#### Scenario: No due schedules is a no-op

- GIVEN no schedules match `findDueForReminder`
- WHEN `DispatchDueCareReminders` is dispatched
- THEN the handler completes without error and without calling the port

---

### Requirement: Cron Trigger

An `@Injectable()` scheduler MUST dispatch `DispatchDueCareRemindersCommand`
on `@Cron(CronExpression.EVERY_MINUTE)`.

#### Scenario: Cron dispatches the command

- GIVEN the scheduler's cron callback fires
- WHEN it runs
- THEN `CommandBus.execute(new DispatchDueCareRemindersCommand())` is called

---

### Requirement: Cross-Context Boundary to notifications

`care-schedule` MUST NOT import `@contexts/notifications/domain` or
`@contexts/notifications/application` from any file outside
`care-schedule/infrastructure/adapters/notify-due-care-schedule.adapter.ts`.

#### Scenario: No forbidden imports outside the adapter

- GIVEN the source tree under `src/contexts/care-schedule/`
- WHEN scanned for `@contexts/notifications` imports
- THEN the only match is `infrastructure/adapters/notify-due-care-schedule.adapter.ts`

---

## Out of Scope

- Any change to `create`, `update`, `delete`, or `complete` command
  semantics — unchanged by this delta.
- Multi-instance cron coordination / distributed locking.
- Retrying a failed notification for the same due occurrence.
