import { registerEnumType } from '@nestjs/graphql';

import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationQueryableField } from '@contexts/notifications/transport/graphql/enums/notification-queryable-field.enum';

// type/referenceType are deliberately plain strings, not registered GraphQL
// enums — their possible values are defined by whichever bounded context
// dispatches the notification, not by notifications itself.

registerEnumType(NotificationStatusEnum, {
  name: 'NotificationStatusEnum',
  description: 'Whether the recipient has read a notification',
});

registerEnumType(NotificationQueryableField, {
  name: 'NotificationQueryableFieldEnum',
  description: 'The notification fields that can be filtered/sorted on',
});
