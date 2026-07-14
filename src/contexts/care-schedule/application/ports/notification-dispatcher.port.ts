import { UpsertConditionNotificationInput } from '@contexts/care-schedule/application/ports/upsert-condition-notification.input';

export const NOTIFICATION_DISPATCHER_PORT = Symbol(
  'NOTIFICATION_DISPATCHER_PORT',
);

/**
 * Tells the notifications context whether a CARE_SCHEDULE_DUE condition is
 * currently true for a given schedule. Implemented by an adapter that
 * translates to notifications' public UpsertConditionNotificationCommand via
 * the Command bus — care-schedule decides WHEN to notify, notifications
 * decides HOW (dedupe, fan-out, delivery).
 */
export interface INotificationDispatcherPort {
  dispatch(input: UpsertConditionNotificationInput): Promise<void>;
}
