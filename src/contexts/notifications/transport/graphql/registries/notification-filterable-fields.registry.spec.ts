import { FilterOperator } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationQueryableField } from '@contexts/notifications/transport/graphql/enums/notification-queryable-field.enum';
import { notificationFilterableFields } from '@contexts/notifications/transport/graphql/registries/notification-filterable-fields.registry';

describe('notificationFilterableFields', () => {
  const pipe = new FilterValidationPipe(notificationFilterableFields);

  it('has an entry for every NotificationQueryableField value', () => {
    for (const field of Object.values(NotificationQueryableField)) {
      expect(notificationFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts an EQUALS filter on status with a real enum value', () => {
    const input = {
      filters: [
        {
          field: NotificationQueryableField.STATUS,
          operator: FilterOperator.EQUALS,
          value: NotificationStatusEnum.UNREAD,
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects a status value outside the enum', () => {
    const input = {
      filters: [
        {
          field: NotificationQueryableField.STATUS,
          operator: FilterOperator.EQUALS,
          value: 'ARCHIVED',
        },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/expected one of/);
  });

  it('rejects a filter on a field outside the whitelist (e.g. userId)', () => {
    const input = {
      filters: [
        { field: 'userId', operator: FilterOperator.EQUALS, value: 'x' },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/Unknown filter field/);
  });
});
