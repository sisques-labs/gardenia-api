import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationQueryableField } from '@contexts/notifications/transport/graphql/enums/notification-queryable-field.enum';

export const notificationFilterableFields: FilterFieldRegistry<NotificationQueryableField> =
  {
    [NotificationQueryableField.ID]: { type: 'uuid' },
    [NotificationQueryableField.TYPE]: { type: 'string' },
    [NotificationQueryableField.REFERENCE_TYPE]: { type: 'string' },
    [NotificationQueryableField.REFERENCE_ID]: { type: 'uuid' },
    [NotificationQueryableField.STATUS]: {
      type: 'enum',
      enum: NotificationStatusEnum,
    },
    [NotificationQueryableField.CREATED_AT]: { type: 'date' },
    [NotificationQueryableField.UPDATED_AT]: { type: 'date' },
  };
