import {
  IAccountReadRepository,
  ACCOUNT_READ_REPOSITORY,
} from '@contexts/auth/domain/repositories/read/account-read.repository';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';
import { AccountFindByCriteriaQuery } from './account-find-by-criteria.query';

@QueryHandler(AccountFindByCriteriaQuery)
export class AccountFindByCriteriaQueryHandler
  implements IQueryHandler<AccountFindByCriteriaQuery>
{
  constructor(
    @Inject(ACCOUNT_READ_REPOSITORY)
    private readonly accountReadRepository: IAccountReadRepository,
  ) {}

  async execute(
    query: AccountFindByCriteriaQuery,
  ): Promise<PaginatedResult<AccountViewModel>> {
    return await this.accountReadRepository.findByCriteria(query.criteria);
  }
}
