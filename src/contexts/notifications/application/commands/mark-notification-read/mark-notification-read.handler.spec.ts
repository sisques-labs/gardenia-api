import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { AssertNotificationExistsService } from '@contexts/notifications/application/services/write/assert-notification-exists/assert-notification-exists.service';
import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationNotOwnedException } from '@contexts/notifications/domain/exceptions/notification-not-owned.exception';
import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { NotificationIdValueObject } from '@contexts/notifications/domain/value-objects/notification-id/notification-id.value-object';
import { NotificationPayloadValueObject } from '@contexts/notifications/domain/value-objects/notification-payload/notification-payload.value-object';
import { NotificationReferenceTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-reference-type/notification-reference-type.value-object';
import { NotificationStatusValueObject } from '@contexts/notifications/domain/value-objects/notification-status/notification-status.value-object';
import { NotificationTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-type/notification-type.value-object';
import { MarkNotificationReadCommand } from './mark-notification-read.command';
import { MarkNotificationReadCommandHandler } from './mark-notification-read.handler';

const NOTIFICATION_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '660e8400-e29b-41d4-a716-446655440001';
const OTHER_USER_ID = '660e8400-e29b-41d4-a716-446655440099';

function buildOwnedNotification(): NotificationAggregate {
  const referenceId = '770e8400-e29b-41d4-a716-446655440002';
  return new NotificationAggregate({
    id: new NotificationIdValueObject(NOTIFICATION_ID),
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
    userId: new UuidValueObject(OWNER_ID),
    spaceId: new UuidValueObject('880e8400-e29b-41d4-a716-446655440003'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('MarkNotificationReadCommandHandler', () => {
  let writeRepository: { save: jest.Mock };
  let assertService: { execute: jest.Mock };
  let handler: MarkNotificationReadCommandHandler;

  beforeEach(() => {
    writeRepository = { save: jest.fn().mockResolvedValue(undefined) };
    assertService = { execute: jest.fn() } as unknown as {
      execute: jest.Mock;
    };
    const eventBus = { publishAll: jest.fn() };
    handler = new MarkNotificationReadCommandHandler(
      writeRepository as any,
      assertService as unknown as AssertNotificationExistsService,
      eventBus as any,
    );
  });

  it('marks the notification read when the requesting user owns it', async () => {
    const notification = buildOwnedNotification();
    assertService.execute.mockResolvedValue(notification);

    await handler.execute(
      new MarkNotificationReadCommand({
        notificationId: NOTIFICATION_ID,
        userId: OWNER_ID,
      }),
    );

    expect(notification.status.value).toBe(NotificationStatusEnum.READ);
    expect(writeRepository.save).toHaveBeenCalledWith(notification);
  });

  it('throws NotificationNotOwnedException when the requesting user does not own it', async () => {
    const notification = buildOwnedNotification();
    assertService.execute.mockResolvedValue(notification);

    await expect(
      handler.execute(
        new MarkNotificationReadCommand({
          notificationId: NOTIFICATION_ID,
          userId: OTHER_USER_ID,
        }),
      ),
    ).rejects.toThrow(NotificationNotOwnedException);
    expect(writeRepository.save).not.toHaveBeenCalled();
  });
});
