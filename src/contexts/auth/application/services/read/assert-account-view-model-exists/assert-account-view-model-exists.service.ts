import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import {
  IAccountReadRepository,
  ACCOUNT_READ_REPOSITORY,
} from '@contexts/auth/domain/repositories/read/account-read.repository';
import { AccountIdValueObject } from '@contexts/auth/domain/value-objects/account-id/account-id.vo';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

@Injectable()
export class AssertAccountViewModelExistsService implements IBaseService {
  constructor(
    @Inject(ACCOUNT_READ_REPOSITORY)
    private readonly accountReadRepository: IAccountReadRepository,
  ) {}

  async execute(id: AccountIdValueObject): Promise<AccountViewModel> {
    const account = await this.accountReadRepository.findById(id.value);
    if (!account) throw new AccountNotFoundException(id.value);

    return account;
  }
}
