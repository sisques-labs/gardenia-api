import { Criteria } from '@sisques-labs/nestjs-kit';

export class FileFindByCriteriaQuery {
  public readonly criteria: Criteria;

  constructor(criteria: Criteria) {
    this.criteria = criteria;
  }
}
