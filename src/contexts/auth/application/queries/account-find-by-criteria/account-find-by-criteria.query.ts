import { Criteria, IFindByCriteriaQueryDto } from '@sisques-labs/nestjs-kit';

export class AccountFindByCriteriaQuery {
  public readonly criteria: Criteria;

  constructor(input: IFindByCriteriaQueryDto) {
    this.criteria = input.criteria;
  }
}
