import { Injectable } from '@nestjs/common';
import { ValidateAccountCredentialsService } from './read/validate-account-credentials/validate-account-credentials.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly validateAccountCredentialsService: ValidateAccountCredentialsService,
  ) {}

  async validateAccount(
    email: string,
    password: string,
  ): Promise<{ userId: string; email: string } | null> {
    const account = await this.validateAccountCredentialsService.execute(
      email,
      password,
    );

    if (!account) {
      return null;
    }

    return { userId: account.userId.value, email: account.email.value };
  }
}
