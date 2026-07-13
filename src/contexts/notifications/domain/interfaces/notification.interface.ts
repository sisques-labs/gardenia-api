import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { NotificationIdValueObject } from '@contexts/notifications/domain/value-objects/notification-id/notification-id.value-object';
import { NotificationPayloadValueObject } from '@contexts/notifications/domain/value-objects/notification-payload/notification-payload.value-object';
import { NotificationReferenceTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-reference-type/notification-reference-type.value-object';
import { NotificationStatusValueObject } from '@contexts/notifications/domain/value-objects/notification-status/notification-status.value-object';
import { NotificationTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-type/notification-type.value-object';

export interface INotification {
  id: NotificationIdValueObject;
  type: NotificationTypeValueObject;
  referenceType: NotificationReferenceTypeValueObject;
  referenceId: UuidValueObject;
  dedupeKey: NotificationDedupeKeyValueObject;
  payload: NotificationPayloadValueObject;
  status: NotificationStatusValueObject;
  readAt: DateValueObject | null;
  resolvedAt: DateValueObject | null;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
