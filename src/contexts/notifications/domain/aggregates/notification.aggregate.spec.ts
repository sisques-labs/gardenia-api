import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NotificationDedupeKeyMismatchException } from '@contexts/notifications/domain/exceptions/notification-dedupe-key-mismatch.exception';
import { NotificationCreatedEvent } from '@contexts/notifications/domain/events/notification-created/notification-created.event';
import { NotificationReadEvent } from '@contexts/notifications/domain/events/notification-read/notification-read.event';
import { NotificationResolvedEvent } from '@contexts/notifications/domain/events/notification-resolved/notification-resolved.event';
import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { NotificationIdValueObject } from '@contexts/notifications/domain/value-objects/notification-id/notification-id.value-object';
import { NotificationPayloadValueObject } from '@contexts/notifications/domain/value-objects/notification-payload/notification-payload.value-object';
import { NotificationReferenceTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-reference-type/notification-reference-type.value-object';
import { NotificationStatusValueObject } from '@contexts/notifications/domain/value-objects/notification-status/notification-status.value-object';
import { NotificationTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-type/notification-type.value-object';
import { NotificationAggregate } from './notification.aggregate';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const REFERENCE_ID = '660e8400-e29b-41d4-a716-446655440001';
const USER_ID = '770e8400-e29b-41d4-a716-446655440002';
const SPACE_ID = '880e8400-e29b-41d4-a716-446655440003';

function buildNotification(overrides?: {
  status?: NotificationStatusEnum;
  resolvedAt?: Date | null;
}): NotificationAggregate {
  return new NotificationAggregate({
    id: new NotificationIdValueObject(ID),
    type: new NotificationTypeValueObject(
      NotificationTypeEnum.CARE_SCHEDULE_DUE,
    ),
    referenceType: new NotificationReferenceTypeValueObject(
      NotificationReferenceTypeEnum.CARE_SCHEDULE,
    ),
    referenceId: new UuidValueObject(REFERENCE_ID),
    dedupeKey: new NotificationDedupeKeyValueObject(
      NotificationDedupeKeyValueObject.compute(
        NotificationTypeEnum.CARE_SCHEDULE_DUE,
        REFERENCE_ID,
      ),
    ),
    payload: new NotificationPayloadValueObject({ plantName: 'Tomatera' }),
    status: new NotificationStatusValueObject(
      overrides?.status ?? NotificationStatusEnum.UNREAD,
    ),
    readAt: null,
    resolvedAt: overrides?.resolvedAt
      ? new DateValueObject(overrides.resolvedAt)
      : null,
    userId: new UuidValueObject(USER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    createdAt: new DateValueObject(new Date('2026-01-01T00:00:00.000Z')),
    updatedAt: new DateValueObject(new Date('2026-01-01T00:00:00.000Z')),
  });
}

describe('NotificationAggregate', () => {
  it('constructs successfully when dedupeKey matches type+referenceId', () => {
    expect(() => buildNotification()).not.toThrow();
  });

  it('throws NotificationDedupeKeyMismatchException when dedupeKey does not match', () => {
    expect(
      () =>
        new NotificationAggregate({
          id: new NotificationIdValueObject(ID),
          type: new NotificationTypeValueObject(
            NotificationTypeEnum.INVENTORY_LOW_STOCK,
          ),
          referenceType: new NotificationReferenceTypeValueObject(
            NotificationReferenceTypeEnum.INVENTORY_ITEM,
          ),
          referenceId: new UuidValueObject(REFERENCE_ID),
          dedupeKey: new NotificationDedupeKeyValueObject(
            `${NotificationTypeEnum.INVENTORY_EXPIRING_SOON}:${REFERENCE_ID}`,
          ),
          payload: new NotificationPayloadValueObject({}),
          status: new NotificationStatusValueObject(
            NotificationStatusEnum.UNREAD,
          ),
          readAt: null,
          resolvedAt: null,
          userId: new UuidValueObject(USER_ID),
          spaceId: new UuidValueObject(SPACE_ID),
          createdAt: new DateValueObject(new Date()),
          updatedAt: new DateValueObject(new Date()),
        }),
    ).toThrow(NotificationDedupeKeyMismatchException);
  });

  it('create() applies NotificationCreatedEvent', () => {
    const notification = buildNotification();
    notification.create();
    const events = notification.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(NotificationCreatedEvent);
  });

  describe('markRead()', () => {
    it('sets status to READ, sets readAt, and applies NotificationReadEvent', () => {
      const notification = buildNotification();
      notification.markRead();

      expect(notification.status.value).toBe(NotificationStatusEnum.READ);
      expect(notification.readAt).not.toBeNull();
      const events = notification.getUncommittedEvents();
      expect(events.some((e) => e instanceof NotificationReadEvent)).toBe(true);
    });

    it('is idempotent: calling markRead() twice keeps the same readAt and only one event', () => {
      const notification = buildNotification();
      notification.markRead();
      const firstReadAt = notification.readAt?.value;
      notification.markRead();

      expect(notification.readAt?.value).toEqual(firstReadAt);
      const readEvents = notification
        .getUncommittedEvents()
        .filter((e) => e instanceof NotificationReadEvent);
      expect(readEvents).toHaveLength(1);
    });

    it('does not change resolvedAt', () => {
      const notification = buildNotification();
      notification.markRead();
      expect(notification.resolvedAt).toBeNull();
    });
  });

  describe('resolve()', () => {
    it('sets resolvedAt and applies NotificationResolvedEvent', () => {
      const notification = buildNotification();
      notification.resolve();

      expect(notification.resolvedAt).not.toBeNull();
      const events = notification.getUncommittedEvents();
      expect(events.some((e) => e instanceof NotificationResolvedEvent)).toBe(
        true,
      );
    });

    it('is idempotent: calling resolve() twice keeps the same resolvedAt and only one event', () => {
      const notification = buildNotification();
      notification.resolve();
      const firstResolvedAt = notification.resolvedAt?.value;
      notification.resolve();

      expect(notification.resolvedAt?.value).toEqual(firstResolvedAt);
      const resolvedEvents = notification
        .getUncommittedEvents()
        .filter((e) => e instanceof NotificationResolvedEvent);
      expect(resolvedEvents).toHaveLength(1);
    });

    it('does not change status', () => {
      const notification = buildNotification();
      notification.resolve();
      expect(notification.status.value).toBe(NotificationStatusEnum.UNREAD);
    });
  });
});
