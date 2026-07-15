import { MessageEvent } from '@nestjs/common';

import { NotificationCreatedEvent } from '@contexts/notifications/domain/events/notification-created/notification-created.event';
import { NotificationReadEvent } from '@contexts/notifications/domain/events/notification-read/notification-read.event';
import { NotificationResolvedEvent } from '@contexts/notifications/domain/events/notification-resolved/notification-resolved.event';

export type NotificationDomainEvent =
  | NotificationCreatedEvent
  | NotificationReadEvent
  | NotificationResolvedEvent;

const SSE_EVENT_TYPE: Record<string, string> = {
  [NotificationCreatedEvent.name]: 'notification-created',
  [NotificationReadEvent.name]: 'notification-read',
  [NotificationResolvedEvent.name]: 'notification-resolved',
};

export function toSseMessageEvent(
  event: NotificationDomainEvent,
): MessageEvent {
  return {
    type: SSE_EVENT_TYPE[event.constructor.name],
    data: JSON.stringify({
      type: SSE_EVENT_TYPE[event.constructor.name],
      notificationId: event.data.id,
    }),
  };
}

export function isNotificationDomainEvent(
  event: unknown,
): event is NotificationDomainEvent {
  return (
    event instanceof NotificationCreatedEvent ||
    event instanceof NotificationReadEvent ||
    event instanceof NotificationResolvedEvent
  );
}
