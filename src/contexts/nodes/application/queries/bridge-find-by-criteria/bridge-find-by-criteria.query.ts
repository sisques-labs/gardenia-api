import { Criteria } from '@sisques-labs/nestjs-kit';

export interface BridgeFindByCriteriaQueryInput {
  criteria: Criteria;
}

export class BridgeFindByCriteriaQuery {
  public readonly criteria: Criteria;

  constructor(input: BridgeFindByCriteriaQueryInput) {
    this.criteria = input.criteria;
  }
}
