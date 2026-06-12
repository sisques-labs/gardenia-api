import { HarvestCriteria } from '@contexts/harvests/domain/repositories/read/harvest-read.repository';

export class HarvestFindByCriteriaQuery {
  public readonly criteria: HarvestCriteria;

  constructor(criteria: HarvestCriteria) {
    this.criteria = criteria;
  }
}
