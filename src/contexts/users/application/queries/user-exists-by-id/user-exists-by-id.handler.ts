import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '@contexts/users/domain/repositories/write/user-write.repository';

import { UserExistsByIdQuery } from './user-exists-by-id.query';

@QueryHandler(UserExistsByIdQuery)
export class UserExistsByIdQueryHandler implements IQueryHandler<UserExistsByIdQuery> {
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
  ) {}

  async execute(query: UserExistsByIdQuery): Promise<boolean> {
    const user = await this.userWriteRepository.findById(query.id);
    return user !== null;
  }
}
