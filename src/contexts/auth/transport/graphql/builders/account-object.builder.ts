import { AccountObject } from '@contexts/auth/transport/graphql/objects/account.object';
import { Injectable } from '@nestjs/common';
import { BaseBuilder } from '@sisques-labs/nestjs-kit';

@Injectable()
export class AccountObjectBuilder extends BaseBuilder<
  AccountObject,
  AccountObject
> {
  private _userId!: string;
  private _email!: string;

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withEmail(email: string): this {
    this._email = email;
    return this;
  }

  build(): AccountObject {
    const obj = new AccountObject();
    obj.id = this._id;
    obj.userId = this._userId;
    obj.email = this._email;
    obj.createdAt = this._createdAt;
    obj.updatedAt = this._updatedAt;
    return obj;
  }

  buildViewModel(): AccountObject {
    return this.build();
  }
}
