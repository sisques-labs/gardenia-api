import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '../../domain/repositories/i-account-write.repository';

@Injectable()
export class AuthService {
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
  ) {}

  async validateAccount(
    email: string,
    password: string,
  ): Promise<{ userId: string; email: string } | null> {
    const account = await this.accountWriteRepository.findByEmail(email);

    if (!account) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, account.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return { userId: account.userId, email: account.email };
  }
}
