import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '../../../domain/repositories/i-user-write.repository';
import { FindUserByEmailQuery } from './find-user-by-email.query';
import { FindUserByEmailResult } from './find-user-by-email.result';

@QueryHandler(FindUserByEmailQuery)
export class FindUserByEmailQueryHandler
  implements IQueryHandler<FindUserByEmailQuery>
{
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
  ) {}

  async execute(query: FindUserByEmailQuery): Promise<FindUserByEmailResult> {
    const user = await this.userWriteRepository.findByEmail(query.email);

    if (!user) {
      return null;
    }

    return {
      id: user.id.value,
      email: user.email,
      passwordHash: user.passwordHash,
    };
  }
}
