import { Criteria, IFindByCriteriaQueryDto } from '@sisques-labs/nestjs-kit';

export class PlantingSpotFindByCriteriaQuery {
  public readonly criteria: Criteria;
  public readonly resolve: boolean;

  constructor(input: IFindByCriteriaQueryDto & { resolve?: boolean }) {
    this.criteria = input.criteria;
    this.resolve = input.resolve ?? false;
  }
}
