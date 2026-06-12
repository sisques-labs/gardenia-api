import { Criteria } from '@sisques-labs/nestjs-kit';

export interface CareLogFindByCriteriaQueryInput {
  criteria: Criteria;
}

export class CareLogFindByCriteriaQuery {
  public readonly criteria: Criteria;

  constructor(input: CareLogFindByCriteriaQueryInput) {
    this.criteria = input.criteria;
  }
}
