import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface LoginUserCommandInput {
  userId: string;
  email: string;
}

export class LoginUserCommand {
  public readonly userId: UuidValueObject;
  public readonly email: AccountEmailValueObject;

  constructor(input: LoginUserCommandInput) {
    this.userId = new UuidValueObject(input.userId);
    this.email = new AccountEmailValueObject(input.email);
  }
}
