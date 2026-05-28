import { AccountPasswordHashValueObject } from '@contexts/auth/domain/value-objects/account-password-hash/account-password-hash.vo';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type ChangePasswordCommandInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export class ChangePasswordCommand {
  public readonly userId: UuidValueObject;
  public readonly currentPassword: AccountPasswordHashValueObject;
  public readonly newPassword: AccountPasswordHashValueObject;

  constructor(input: ChangePasswordCommandInput) {
    this.userId = new UuidValueObject(input.userId);
    this.currentPassword = new AccountPasswordHashValueObject(
      input.currentPassword,
    );
    this.newPassword = new AccountPasswordHashValueObject(input.newPassword);
  }
}
