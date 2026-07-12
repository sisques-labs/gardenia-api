import { Criteria } from '@sisques-labs/nestjs-kit';

export interface NodeFindByCriteriaQueryInput {
  criteria: Criteria;
}

export class NodeFindByCriteriaQuery {
  public readonly criteria: Criteria;

  constructor(input: NodeFindByCriteriaQueryInput) {
    this.criteria = input.criteria;
  }
}
