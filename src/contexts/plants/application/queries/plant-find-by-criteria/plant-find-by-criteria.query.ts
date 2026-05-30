import { Criteria, IFindByCriteriaQueryDto } from '@sisques-labs/nestjs-kit';

export class PlantFindByCriteriaQuery {
  public readonly criteria: Criteria;

  constructor(input: IFindByCriteriaQueryDto) {
    this.criteria = input.criteria;
  }
}
