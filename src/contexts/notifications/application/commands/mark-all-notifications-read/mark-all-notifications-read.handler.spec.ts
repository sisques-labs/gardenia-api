import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { NotificationIdValueObject } from '@contexts/notifications/domain/value-objects/notification-id/notification-id.value-object';
import { NotificationPayloadValueObject } from '@contexts/notifications/domain/value-objects/notification-payload/notification-payload.value-object';
import { NotificationReferenceTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-reference-type/notification-reference-type.value-object';
import { NotificationStatusValueObject } from '@contexts/notifications/domain/value-objects/notification-status/notification-status.value-object';
import { NotificationTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-type/notification-type.value-object';
import { MarkAllNotificationsReadCommand } from './mark-all-notifications-read.command';
import { MarkAllNotificationsReadCommandHandler } from './mark-all-notifications-read.handler';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';

function buildUnreadNotification(id: string): NotificationAggregate {
  const referenceId = '770e8400-e29b-41d4-a716-446655440002';
  return new NotificationAggregate({
    id: new NotificationIdValueObject(id),
    type: new NotificationTypeValueObject(
      NotificationTypeEnum.CARE_SCHEDULE_DUE,
    ),
    referenceType: new NotificationReferenceTypeValueObject(
      NotificationReferenceTypeEnum.CARE_SCHEDULE,
    ),
    referenceId: new UuidValueObject(referenceId),
    dedupeKey: new NotificationDedupeKeyValueObject(
      NotificationDedupeKeyValueObject.compute(
        NotificationTypeEnum.CARE_SCHEDULE_DUE,
        referenceId,
      ),
    ),
    payload: new NotificationPayloadValueObject({}),
    status: new NotificationStatusValueObject(NotificationStatusEnum.UNREAD),
    readAt: null,
    resolvedAt: null,
    userId: new UuidValueObject(USER_ID),
    spaceId: new UuidValueObject('880e8400-e29b-41d4-a716-446655440003'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('MarkAllNotificationsReadCommandHandler', () => {
  it('marks every unread notification for the user read and saves them all', async () => {
    const notifications = [
      buildUnreadNotification('550e8400-e29b-41d4-a716-446655440000'),
      buildUnreadNotification('550e8400-e29b-41d4-a716-446655440111'),
    ];
    const writeRepository = {
      findUnreadByUserId: jest.fn().mockResolvedValue(notifications),
      saveMany: jest.fn().mockResolvedValue(undefined),
    };
    const eventBus = { publishAll: jest.fn() };

    const handler = new MarkAllNotificationsReadCommandHandler(
      writeRepository as any,
      eventBus as unknown as EventBus,
    );

    await handler.execute(new MarkAllNotificationsReadCommand(USER_ID));

    expect(writeRepository.findUnreadByUserId).toHaveBeenCalledWith(USER_ID);
    expect(
      notifications.every(
        (n) => n.status.value === NotificationStatusEnum.READ,
      ),
    ).toBe(true);
    expect(writeRepository.saveMany).toHaveBeenCalledWith(notifications);
  });

  it('is a no-op when there are no unread notifications', async () => {
    const writeRepository = {
      findUnreadByUserId: jest.fn().mockResolvedValue([]),
      saveMany: jest.fn().mockResolvedValue(undefined),
    };
    const eventBus = { publishAll: jest.fn() };

    const handler = new MarkAllNotificationsReadCommandHandler(
      writeRepository as any,
      eventBus as unknown as EventBus,
    );

    await handler.execute(new MarkAllNotificationsReadCommand(USER_ID));

    expect(writeRepository.saveMany).toHaveBeenCalledWith([]);
  });
});
