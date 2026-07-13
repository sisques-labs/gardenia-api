import { InvalidStringException } from '@sisques-labs/nestjs-kit';

import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { NotificationDedupeKeyValueObject } from './notification-dedupe-key.value-object';

describe('NotificationDedupeKeyValueObject', () => {
  it('accepts a non-empty string', () => {
    expect(
      () => new NotificationDedupeKeyValueObject('CARE_SCHEDULE_DUE:some-id'),
    ).not.toThrow();
  });

  it('rejects an empty string', () => {
    expect(() => new NotificationDedupeKeyValueObject('')).toThrow(
      InvalidStringException,
    );
  });

  describe('compute()', () => {
    it('builds "{type}:{referenceId}"', () => {
      expect(
        NotificationDedupeKeyValueObject.compute(
          NotificationTypeEnum.INVENTORY_LOW_STOCK,
          'item-123',
        ),
      ).toBe('INVENTORY_LOW_STOCK:item-123');
    });
  });
});
