import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { AccountPasswordHashValueObject } from '@contexts/auth/domain/value-objects/account-password-hash/account-password-hash.vo';

export interface LoginAccountCommandInput {
  email: string;
  password: string;
}

export class LoginAccountCommand {
  public readonly email: AccountEmailValueObject;
  public readonly password: AccountPasswordHashValueObject;

  constructor(input: LoginAccountCommandInput) {
    this.email = new AccountEmailValueObject(input.email);
    this.password = new AccountPasswordHashValueObject(input.password);
  }
}
