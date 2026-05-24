import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { AccountPasswordHashValueObject } from '@contexts/auth/domain/value-objects/account-password-hash/account-password-hash.vo';

export interface RegisterAccountCommandInput {
  email: string;
  password: string;
}

export class RegisterAccountCommand {
  public readonly email: AccountEmailValueObject;
  public readonly passwordHash: AccountPasswordHashValueObject;

  constructor(input: RegisterAccountCommandInput) {
    this.email = new AccountEmailValueObject(input.email);
    this.passwordHash = new AccountPasswordHashValueObject(input.password);
  }
}
