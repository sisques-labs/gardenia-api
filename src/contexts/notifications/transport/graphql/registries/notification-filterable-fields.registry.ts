import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { NotificationQueryableField } from '@contexts/notifications/transport/graphql/enums/notification-queryable-field.enum';

export const notificationFilterableFields: FilterFieldRegistry<NotificationQueryableField> =
  {
    [NotificationQueryableField.ID]: { type: 'uuid' },
    [NotificationQueryableField.TYPE]: {
      type: 'enum',
      enum: NotificationTypeEnum,
    },
    [NotificationQueryableField.REFERENCE_TYPE]: {
      type: 'enum',
      enum: NotificationReferenceTypeEnum,
    },
    [NotificationQueryableField.REFERENCE_ID]: { type: 'uuid' },
    [NotificationQueryableField.STATUS]: {
      type: 'enum',
      enum: NotificationStatusEnum,
    },
    [NotificationQueryableField.CREATED_AT]: { type: 'date' },
    [NotificationQueryableField.UPDATED_AT]: { type: 'date' },
  };
