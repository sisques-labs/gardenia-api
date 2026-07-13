import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class MarkAllNotificationsReadCommand {
  public readonly userId: UuidValueObject;

  constructor(userId: string) {
    this.userId = new UuidValueObject(userId);
  }
}
