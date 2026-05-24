import { UserFindByCriteriaQuery } from '@contexts/users/application/queries/user-find-by-criteria/user-find-by-criteria.query';
import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
} from '@contexts/users/domain/repositories/read/user-read.repository';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

@QueryHandler(UserFindByCriteriaQuery)
export class UserFindByCriteriaQueryHandler implements IQueryHandler<UserFindByCriteriaQuery> {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(
    query: UserFindByCriteriaQuery,
  ): Promise<PaginatedResult<UserViewModel>> {
    return await this.userReadRepository.findByCriteria(query.criteria);
  }
}
