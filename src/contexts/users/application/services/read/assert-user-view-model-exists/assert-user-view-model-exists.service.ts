import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
} from '@contexts/users/domain/repositories/read/user-read.repository';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

@Injectable()
export class AssertUserViewModelExistsService implements IBaseService {
  constructor(
    @Inject(USER_READ_REPOSITORY)
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async execute(id: UserIdValueObject): Promise<UserViewModel> {
    const user = await this.userReadRepository.findById(id.value);
    if (!user) throw new UserNotFoundException(id.value);

    return user;
  }
}
