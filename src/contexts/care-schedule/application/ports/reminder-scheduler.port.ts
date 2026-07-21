import { ScheduleReminderInput } from '@contexts/care-schedule/application/ports/schedule-reminder.input';

export const REMINDER_SCHEDULER_PORT = Symbol('REMINDER_SCHEDULER_PORT');

export interface IReminderSchedulerPort {
  /**
   * Schedules (or replaces) a delayed reminder for this schedule, firing at
   * `dueAt`. Implemented by an adapter that enqueues into the
   * push-notifications BullMQ queue — no cron, no polling.
   */
  scheduleReminder(input: ScheduleReminderInput): Promise<void>;

  /** Cancels any pending reminder job for this schedule, if one exists. */
  cancelReminder(careScheduleId: string): Promise<void>;
}
