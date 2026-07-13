import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';

export const NOTIFICATION_DISPATCHER_PORT = Symbol(
  'NOTIFICATION_DISPATCHER_PORT',
);

/**
 * Seam for a future push/email channel. v1 ships only a no-op adapter — this
 * port exists so the reconciliation flow doesn't need to change when a real
 * channel lands.
 */
export interface INotificationDispatcherPort {
  dispatch(notification: NotificationViewModel): Promise<void>;
}
