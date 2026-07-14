import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { INotificationPrimitives } from '@contexts/notifications/domain/primitives/notification.primitives';
import { NotificationIdValueObject } from '@contexts/notifications/domain/value-objects/notification-id/notification-id.value-object';

export type MarkNotificationReadCommandInput = Pick<
  INotificationPrimitives,
  'id'
> & {
  requestingUserId: string;
};

export class MarkNotificationReadCommand {
  public readonly id: NotificationIdValueObject;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: MarkNotificationReadCommandInput) {
    this.id = new NotificationIdValueObject(input.id);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
  }
}
