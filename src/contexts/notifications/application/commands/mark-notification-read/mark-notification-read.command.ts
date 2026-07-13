import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NotificationIdValueObject } from '@contexts/notifications/domain/value-objects/notification-id/notification-id.value-object';

export type MarkNotificationReadCommandInput = {
  notificationId: string;
  userId: string;
};

export class MarkNotificationReadCommand {
  public readonly notificationId: NotificationIdValueObject;
  public readonly userId: UuidValueObject;

  constructor(input: MarkNotificationReadCommandInput) {
    this.notificationId = new NotificationIdValueObject(input.notificationId);
    this.userId = new UuidValueObject(input.userId);
  }
}
