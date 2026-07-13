import { EventBus } from '@nestjs/cqrs';

import { NotificationCreatedEvent } from '@contexts/notifications/domain/events/notification-created/notification-created.event';
import { NotificationReadEvent } from '@contexts/notifications/domain/events/notification-read/notification-read.event';
import { INotificationEventData } from '@contexts/notifications/domain/events/interfaces/notification-event-data.interface';
import { NotificationSseConnectionRegistry } from './notification-sse-connection.registry';
import { NotificationSseForwarderService } from './notification-sse-forwarder.service';

const eventData: INotificationEventData = {
  id: 'notif-1',
  type: 'CARE_SCHEDULE_DUE',
  referenceType: 'CARE_SCHEDULE',
  referenceId: 'ref-1',
  dedupeKey: 'CARE_SCHEDULE_DUE:ref-1',
  payload: {},
  status: 'UNREAD',
  readAt: null,
  resolvedAt: null,
  userId: 'user-1',
  spaceId: 'space-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildEvent(): NotificationCreatedEvent {
  return new NotificationCreatedEvent(
    {
      aggregateRootId: 'notif-1',
      aggregateRootType: 'NotificationAggregate',
      entityId: 'notif-1',
      entityType: 'NotificationAggregate',
      eventType: 'NotificationCreatedEvent',
    },
    eventData,
  );
}

describe('NotificationSseForwarderService', () => {
  let subscribeCallback: (event: unknown) => void;
  let eventBus: { subscribe: jest.Mock };
  let registry: { publish: jest.Mock };

  beforeEach(() => {
    eventBus = {
      subscribe: jest.fn((cb: (event: unknown) => void) => {
        subscribeCallback = cb;
        return { unsubscribe: jest.fn() };
      }),
    };
    registry = { publish: jest.fn() };
  });

  it('forwards a NotificationCreatedEvent to the registry for its userId/spaceId', () => {
    const service = new NotificationSseForwarderService(
      eventBus as unknown as EventBus,
      registry as unknown as NotificationSseConnectionRegistry,
    );
    service.onModuleInit();

    subscribeCallback(buildEvent());

    expect(registry.publish).toHaveBeenCalledWith(
      'user-1',
      'space-1',
      expect.objectContaining({ type: 'notification-created' }),
    );
  });

  it('forwards a NotificationReadEvent with the correct SSE type', () => {
    const service = new NotificationSseForwarderService(
      eventBus as unknown as EventBus,
      registry as unknown as NotificationSseConnectionRegistry,
    );
    service.onModuleInit();

    const readEvent = new NotificationReadEvent(
      {
        aggregateRootId: 'notif-1',
        aggregateRootType: 'NotificationAggregate',
        entityId: 'notif-1',
        entityType: 'NotificationAggregate',
        eventType: 'NotificationReadEvent',
      },
      eventData,
    );
    subscribeCallback(readEvent);

    expect(registry.publish).toHaveBeenCalledWith(
      'user-1',
      'space-1',
      expect.objectContaining({ type: 'notification-read' }),
    );
  });

  it('ignores unrelated events from other contexts', () => {
    const service = new NotificationSseForwarderService(
      eventBus as unknown as EventBus,
      registry as unknown as NotificationSseConnectionRegistry,
    );
    service.onModuleInit();

    subscribeCallback({ some: 'unrelated-event' });

    expect(registry.publish).not.toHaveBeenCalled();
  });
});
