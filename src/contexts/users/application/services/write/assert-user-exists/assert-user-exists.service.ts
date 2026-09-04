import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '@contexts/users/domain/repositories/write/user-write.repository';

import { Inject, Injectable } from '@nestjs/common';
import { IBaseService, UuidValueObject } from '@sisques-labs/nestjs-kit';
@Injectable()
export class AssertUserExistsService implements IBaseService {
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
  ) {}

  async execute(id: UuidValueObject): Promise<UserAggregate> {
    const user = await this.userWriteRepository.findById(id.value);
    if (!user) throw new UserNotFoundException(id.value);

    return user;
  }
}
