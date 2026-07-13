import { registerEnumType } from '@nestjs/graphql';

import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import { NotificationQueryableField } from '@contexts/notifications/transport/graphql/enums/notification-queryable-field.enum';

registerEnumType(NotificationTypeEnum, {
  name: 'NotificationTypeEnum',
  description: 'The kind of condition a notification reports',
});

registerEnumType(NotificationReferenceTypeEnum, {
  name: 'NotificationReferenceTypeEnum',
  description: 'The kind of entity a notification references',
});

registerEnumType(NotificationStatusEnum, {
  name: 'NotificationStatusEnum',
  description: 'Whether the recipient has read a notification',
});

registerEnumType(NotificationQueryableField, {
  name: 'NotificationQueryableFieldEnum',
  description: 'The notification fields that can be filtered/sorted on',
});
