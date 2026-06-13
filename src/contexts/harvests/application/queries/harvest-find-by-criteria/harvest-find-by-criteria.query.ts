import { Criteria } from '@sisques-labs/nestjs-kit';

export class HarvestFindByCriteriaQuery {
  public readonly criteria: Criteria;

  constructor(criteria: Criteria) {
    this.criteria = criteria;
  }
}
