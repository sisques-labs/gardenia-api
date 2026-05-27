import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ValidateAccountCredentialsService {
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
  ) {}

  async execute(
    email: string,
    password: string,
  ): Promise<AccountAggregate | null> {
    const account = await this.accountWriteRepository.findByEmail(email);

    if (!account) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      account.passwordHash.value,
    );

    return isPasswordValid ? account : null;
  }
}
