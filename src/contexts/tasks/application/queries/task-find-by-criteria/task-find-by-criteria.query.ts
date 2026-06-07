import { Criteria } from '@sisques-labs/nestjs-kit';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface TaskFindByCriteriaQueryInput {
  criteria: Criteria;
  userId: string;
}

export class TaskFindByCriteriaQuery {
  public readonly criteria: Criteria;
  public readonly userId: UuidValueObject;

  constructor(input: TaskFindByCriteriaQueryInput) {
    this.criteria = input.criteria;
    this.userId = new UuidValueObject(input.userId);
  }
}
