import { BaseAggregate, DateValueObject } from '@sisques-labs/nestjs-kit';

import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class AccountAggregate extends BaseAggregate {
  private readonly _id: UuidValueObject;
  private readonly _userId: string;
  private readonly _email: string;
  private readonly _passwordHash: string;

  constructor(
    id: UuidValueObject,
    userId: string,
    email: string,
    passwordHash: string,
    createdAt: DateValueObject,
    updatedAt: DateValueObject,
  ) {
    super(createdAt, updatedAt);
    this._id = id;
    this._userId = userId;
    this._email = email;
    this._passwordHash = passwordHash;
  }

  get id(): UuidValueObject {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get email(): string {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  toPrimitives(): {
    id: string;
    userId: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this._id.value,
      userId: this._userId,
      email: this._email,
      passwordHash: this._passwordHash,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
