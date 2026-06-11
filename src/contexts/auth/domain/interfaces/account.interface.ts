import { AppRoleValueObject } from '@contexts/auth/domain/value-objects/app-role/app-role.vo';
import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { AccountIdValueObject } from '@contexts/auth/domain/value-objects/account-id/account-id.vo';
import { AccountPasswordHashValueObject } from '@contexts/auth/domain/value-objects/account-password-hash/account-password-hash.vo';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface IAccount {
  id: AccountIdValueObject;
  userId: UuidValueObject;
  email: AccountEmailValueObject;
  passwordHash: AccountPasswordHashValueObject;
  appRole: AppRoleValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
