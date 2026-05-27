import { UsernameAlreadyTakenException } from '@contexts/users/domain/exceptions/username-already-taken.exception';
import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
} from '@contexts/users/domain/repositories/read/user-read.repository';
import { UsernameValueObject } from '@contexts/users/domain/value-objects/username/username.value-object';
import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

@Injectable()
export class AssertUsernameAvailableService implements IBaseService {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(username: UsernameValueObject): Promise<void> {
    const existing = await this.userReadRepository.findByUsername(
      username.value,
    );
    if (existing) throw new UsernameAlreadyTakenException(username.value);
  }
}
