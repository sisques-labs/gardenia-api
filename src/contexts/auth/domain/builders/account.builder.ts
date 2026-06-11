import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { AppRoleValueObject } from '@contexts/auth/domain/value-objects/app-role/app-role.vo';
import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { AccountIdValueObject } from '@contexts/auth/domain/value-objects/account-id/account-id.vo';
import { AccountPasswordHashValueObject } from '@contexts/auth/domain/value-objects/account-password-hash/account-password-hash.vo';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

@Injectable()
export class AccountBuilder extends BaseBuilder<
  AccountAggregate,
  AccountViewModel
> {
  private _userId!: string;
  private _email!: string;
  private _passwordHash!: string;
  private _appRole: string = AppRoleEnum.USER;

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withEmail(email: string): this {
    this._email = email;
    return this;
  }

  withPasswordHash(passwordHash: string): this {
    this._passwordHash = passwordHash;
    return this;
  }

  withAppRole(role: AppRoleValueObject): this {
    this._appRole = role.value;
    return this;
  }

  public override buildViewModel(): AccountViewModel {
    super.validate();
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._email) throw new FieldIsRequiredException('email');

    return new AccountViewModel({
      id: this._id,
      userId: this._userId,
      email: this._email,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override build(): AccountAggregate {
    this.validate();

    return new AccountAggregate({
      id: new AccountIdValueObject(this._id),
      userId: new UuidValueObject(this._userId),
      email: new AccountEmailValueObject(this._email),
      passwordHash: new AccountPasswordHashValueObject(this._passwordHash),
      appRole: new AppRoleValueObject(this._appRole),
      createdAt: new DateValueObject(this._createdAt ?? new Date()),
      updatedAt: new DateValueObject(this._updatedAt ?? new Date()),
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._email) throw new FieldIsRequiredException('email');
    if (!this._passwordHash) throw new FieldIsRequiredException('passwordHash');
  }
}
