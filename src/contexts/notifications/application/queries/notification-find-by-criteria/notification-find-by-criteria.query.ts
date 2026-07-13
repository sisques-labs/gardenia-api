import { Criteria, UuidValueObject } from '@sisques-labs/nestjs-kit';

export class NotificationFindByCriteriaQuery {
  public readonly userId: UuidValueObject;
  public readonly criteria: Criteria;

  constructor(userId: string, criteria: Criteria) {
    this.userId = new UuidValueObject(userId);
    this.criteria = criteria;
  }
}
