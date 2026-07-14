import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationNotOwnedException } from '@contexts/notifications/domain/exceptions/notification-not-owned.exception';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { NotificationIdValueObject } from '@contexts/notifications/domain/value-objects/notification-id/notification-id.value-object';
import { NotificationPayloadValueObject } from '@contexts/notifications/domain/value-objects/notification-payload/notification-payload.value-object';
import { NotificationReferenceTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-reference-type/notification-reference-type.value-object';
import { NotificationStatusValueObject } from '@contexts/notifications/domain/value-objects/notification-status/notification-status.value-object';
import { NotificationTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-type/notification-type.value-object';
import { AssertNotificationOwnedByUserService } from './assert-notification-owned-by-user.service';

const NOTIFICATION_ID = '550e8400-e29b-41d4-a716-446655440000';
const REFERENCE_ID = '770e8400-e29b-41d4-a716-446655440002';
const OWNER_ID = '660e8400-e29b-41d4-a716-446655440001';
const OTHER_USER_ID = '660e8400-e29b-41d4-a716-446655440099';

function buildOwnedNotification(): NotificationAggregate {
  const now = new Date();
  return new NotificationAggregate({
    id: new NotificationIdValueObject(NOTIFICATION_ID),
    type: new NotificationTypeValueObject('CARE_SCHEDULE_DUE'),
    referenceType: new NotificationReferenceTypeValueObject('CARE_SCHEDULE'),
    referenceId: new UuidValueObject(REFERENCE_ID),
    dedupeKey: new NotificationDedupeKeyValueObject(
      NotificationDedupeKeyValueObject.compute(
        'CARE_SCHEDULE_DUE',
        REFERENCE_ID,
      ),
    ),
    payload: new NotificationPayloadValueObject({}),
    status: new NotificationStatusValueObject(NotificationStatusEnum.UNREAD),
    readAt: null,
    resolvedAt: null,
    userId: new UuidValueObject(OWNER_ID),
    spaceId: new UuidValueObject('880e8400-e29b-41d4-a716-446655440003'),
    createdAt: new DateValueObject(now),
    updatedAt: new DateValueObject(now),
  });
}

describe('AssertNotificationOwnedByUserService', () => {
  const service = new AssertNotificationOwnedByUserService();

  it('does not throw when the requesting user owns the notification', () => {
    const notification = buildOwnedNotification();

    expect(() =>
      service.execute(notification, new UuidValueObject(OWNER_ID)),
    ).not.toThrow();
  });

  it('throws NotificationNotOwnedException when the requesting user does not own it', () => {
    const notification = buildOwnedNotification();

    expect(() =>
      service.execute(notification, new UuidValueObject(OTHER_USER_ID)),
    ).toThrow(NotificationNotOwnedException);
  });
});
