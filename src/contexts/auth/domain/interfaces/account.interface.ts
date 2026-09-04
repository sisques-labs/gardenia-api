import { AppRoleValueObject } from '@contexts/auth/domain/value-objects/app-role/app-role.vo';
import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';

import { AccountPasswordHashValueObject } from '@contexts/auth/domain/value-objects/account-password-hash/account-password-hash.vo';
import { IBaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';
export interface IAccount extends IBaseAggregate {
  userId: UuidValueObject;
  email: AccountEmailValueObject;
  passwordHash: AccountPasswordHashValueObject;
  appRole: AppRoleValueObject;
}
