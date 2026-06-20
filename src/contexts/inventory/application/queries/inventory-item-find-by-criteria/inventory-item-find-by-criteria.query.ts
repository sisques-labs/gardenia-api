import { Criteria } from '@sisques-labs/nestjs-kit';

export class InventoryItemFindByCriteriaQuery {
  public readonly criteria: Criteria;

  constructor(criteria: Criteria) {
    this.criteria = criteria;
  }
}
