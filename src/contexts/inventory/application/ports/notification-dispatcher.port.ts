import { UpsertConditionNotificationInput } from '@contexts/inventory/application/ports/upsert-condition-notification.input';

export const NOTIFICATION_DISPATCHER_PORT = Symbol(
  'NOTIFICATION_DISPATCHER_PORT',
);

/**
 * Tells the notifications context whether an INVENTORY_LOW_STOCK or
 * INVENTORY_EXPIRING_SOON condition is currently true for a given item.
 * Implemented by an adapter that translates to notifications' public
 * UpsertConditionNotificationCommand via the Command bus — inventory decides
 * WHEN to notify, notifications decides HOW (dedupe, fan-out, delivery).
 */
export interface INotificationDispatcherPort {
  dispatch(input: UpsertConditionNotificationInput): Promise<void>;
}
