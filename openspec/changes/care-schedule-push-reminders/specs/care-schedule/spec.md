# Care Schedule — Reminder scheduling (delta)

**Source change:** care-schedule-push-reminders (revision 2 — Redis/BullMQ, no cron)
**Created:** 2026-07-21

This is a delta spec against the existing `care-schedule` capability. It adds
reminder scheduling on top of the existing aggregate/commands — it does not
restate requirements unaffected by this change (create/update/delete/complete
value semantics for fields other than the reminder side-effects below are
unchanged). This revision has **no domain or schema changes at all** — no new
field, no new value object, no new query. Everything below is
application-layer orchestration calling a new port.

---

## Requirements

### Requirement: Reminder Scheduling on Create

When `CreateCareSchedule` succeeds and the created schedule is `active`, the
handler MUST call `IReminderSchedulerPort.scheduleReminder()` with the
schedule's `id`, `userId`, `plantId`, `activityType`, and `nextDueAt`.

A failure of this call MUST NOT fail the create — it MUST be caught, logged,
and swallowed (the schedule is created regardless).

#### Scenario: New active schedule is queued for a reminder

- GIVEN a valid `CreateCareSchedule` command
- WHEN it is dispatched
- THEN the schedule is created and `scheduleReminder` is called with its `nextDueAt`

#### Scenario: Reminder scheduling failure does not block creation

- GIVEN `scheduleReminder` throws
- WHEN `CreateCareSchedule` is dispatched
- THEN the schedule is still created and returned successfully

---

### Requirement: Reminder Rescheduling on Completion

When `CompleteCareSchedule` succeeds:
- If the schedule is still `active` after `complete()` (recurring, interval
  set), the handler MUST call `scheduleReminder()` with the **new**
  `nextDueAt`, replacing any previously pending reminder for this schedule.
- If the schedule became inactive after `complete()` (one-time, no
  interval), the handler MUST call `cancelReminder()` instead.

Both calls MUST be best-effort (caught, logged, swallowed on failure).

#### Scenario: Recurring schedule reschedules its reminder

- GIVEN an active, recurring schedule due today
- WHEN it is completed
- THEN `scheduleReminder` is called with the newly computed `nextDueAt`, and any reminder pending for the old due date is replaced (not duplicated)

#### Scenario: One-time schedule cancels its reminder

- GIVEN a one-time (no interval) schedule
- WHEN it is completed
- THEN `cancelReminder` is called and no further reminder fires for it

#### Scenario: Early completion replaces a still-pending reminder

- GIVEN a recurring schedule completed before its previously scheduled reminder fires
- WHEN completion recalculates `nextDueAt`
- THEN the stale reminder for the old due date does not fire — it is replaced by the new one

---

### Requirement: Reminder Toggling on Activation State Change

When `UpdateCareSchedule` changes `active`:
- `true → false` MUST call `cancelReminder()`.
- `false → true` MUST call `scheduleReminder()` with the schedule's current
  `nextDueAt` (if already in the past, the resulting reminder fires
  immediately rather than being skipped).

If `active` is unchanged by the update, neither call MUST be made.

#### Scenario: Deactivating cancels the pending reminder

- GIVEN an active schedule with a pending reminder
- WHEN `UpdateCareSchedule` sets `active=false`
- THEN `cancelReminder` is called

#### Scenario: Reactivating an overdue schedule reminds immediately

- GIVEN an inactive schedule whose `nextDueAt` is in the past
- WHEN `UpdateCareSchedule` sets `active=true`
- THEN `scheduleReminder` is called and the resulting reminder fires without further delay

#### Scenario: No-op when active is unchanged

- GIVEN an update that does not touch `active`
- WHEN `UpdateCareSchedule` is dispatched
- THEN neither `scheduleReminder` nor `cancelReminder` is called

---

### Requirement: Reminder Cancellation on Deletion

`DeleteCareSchedule` MUST call `cancelReminder()` for the deleted schedule's
id, best-effort.

#### Scenario: Deleting cancels any pending reminder

- GIVEN a schedule with a pending reminder
- WHEN `DeleteCareSchedule` is dispatched
- THEN `cancelReminder` is called

---

### Requirement: Cross-Context Boundary to notifications

`care-schedule` MUST NOT import `@contexts/notifications/domain` or
`@contexts/notifications/application` from anywhere. The adapter
implementing `IReminderSchedulerPort` communicates with `notifications`
exclusively through the `push-notifications` queue, using a plain,
duck-typed payload — it requires no compile-time type from
`@contexts/notifications` at all.

#### Scenario: No notifications import anywhere in care-schedule

- GIVEN the source tree under `src/contexts/care-schedule/`
- WHEN scanned for `@contexts/notifications` imports
- THEN there are none

---

## Out of Scope

- Any change to `create`/`update`/`delete`/`complete`'s existing field
  semantics — unchanged by this delta.
- A reconciliation job that re-schedules reminders for due-but-unqueued
  schedules — explicitly not built in this revision (see design.md's Open
  Questions).
- Multi-instance coordination beyond what BullMQ's own Redis-backed atomicity
  already provides.
