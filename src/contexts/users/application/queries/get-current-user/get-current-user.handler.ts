import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
  UserViewModel,
} from '../../../domain/repositories/read/user-read.repository';
import { GetCurrentUserQuery } from './get-current-user.query';

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserQueryHandler implements IQueryHandler<GetCurrentUserQuery> {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(query: GetCurrentUserQuery): Promise<UserViewModel | null> {
    return this.userReadRepository.findById(query.userId);
  }
}
