import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import {
  IAccountWriteRepository,
  ACCOUNT_WRITE_REPOSITORY,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { AccountIdValueObject } from '@contexts/auth/domain/value-objects/account-id/account-id.vo';
import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

@Injectable()
export class AssertAccountExistsService implements IBaseService {
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
  ) {}

  async execute(id: AccountIdValueObject): Promise<AccountAggregate> {
    const account = await this.accountWriteRepository.findById(id.value);
    if (!account) throw new AccountNotFoundException(id.value);

    return account;
  }
}
