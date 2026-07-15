import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationBuilder } from './notification.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const REFERENCE_ID = '660e8400-e29b-41d4-a716-446655440001';
const USER_ID = '770e8400-e29b-41d4-a716-446655440002';
const SPACE_ID = '880e8400-e29b-41d4-a716-446655440003';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const base = (): NotificationBuilder =>
  new NotificationBuilder()
    .withId(ID)
    .withType('CARE_SCHEDULE_DUE')
    .withReferenceType('CARE_SCHEDULE')
    .withReferenceId(REFERENCE_ID)
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('NotificationBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with dedupeKey computed from type+referenceId', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.type.value).toBe('CARE_SCHEDULE_DUE');
      expect(aggregate.referenceId.value).toBe(REFERENCE_ID);
      expect(aggregate.dedupeKey.value).toBe(
        `CARE_SCHEDULE_DUE:${REFERENCE_ID}`,
      );
      expect(aggregate.status.value).toBe(NotificationStatusEnum.UNREAD);
      expect(aggregate.readAt).toBeNull();
      expect(aggregate.resolvedAt).toBeNull();
    });

    it('defaults status to UNREAD when not set', () => {
      expect(base().build().status.value).toBe(NotificationStatusEnum.UNREAD);
    });

    it('honors an explicit payload', () => {
      const aggregate = base().withPayload({ plantName: 'Tomatera' }).build();
      expect(aggregate.payload.value).toEqual({ plantName: 'Tomatera' });
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with the same computed dedupeKey', () => {
      const vm = base().buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.dedupeKey).toBe(`CARE_SCHEDULE_DUE:${REFERENCE_ID}`);
      expect(vm.status).toBe(NotificationStatusEnum.UNREAD);
    });
  });

  describe('validate()', () => {
    it('throws when type is missing', () => {
      expect(() =>
        base()
          .withType(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when referenceId is missing', () => {
      expect(() =>
        base()
          .withReferenceId(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when userId is missing', () => {
      expect(() =>
        base()
          .withUserId(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
