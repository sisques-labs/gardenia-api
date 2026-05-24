import { BaseAggregate, DateValueObject } from '@sisques-labs/nestjs-kit';

import { UserIdValueObject } from '../value-objects/user-id.value-object';

export class UserAggregate extends BaseAggregate {
  private readonly _id: UserIdValueObject;
  private readonly _email: string;
  private readonly _passwordHash: string;

  constructor(
    id: UserIdValueObject,
    email: string,
    passwordHash: string,
    createdAt: DateValueObject,
    updatedAt: DateValueObject,
  ) {
    super(createdAt, updatedAt);
    this._id = id;
    this._email = email;
    this._passwordHash = passwordHash;
  }

  get id(): UserIdValueObject {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  toPrimitives(): {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this._id.value,
      email: this._email,
      passwordHash: this._passwordHash,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
