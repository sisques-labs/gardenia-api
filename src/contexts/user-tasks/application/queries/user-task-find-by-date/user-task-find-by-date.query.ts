import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class UserTaskFindByDateQuery {
  public readonly userId: UuidValueObject;
  public readonly date: Date;

  constructor(userId: string, date: Date) {
    this.userId = new UuidValueObject(userId);
    this.date = date;
  }
}
