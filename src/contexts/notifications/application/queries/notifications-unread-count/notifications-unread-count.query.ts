import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class NotificationsUnreadCountQuery {
  public readonly userId: UuidValueObject;

  constructor(userId: string) {
    this.userId = new UuidValueObject(userId);
  }
}
