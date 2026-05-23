import * as bcrypt from 'bcrypt';
import { BaseAggregate, DateValueObject } from '@sisques-labs/nestjs-kit';

import { UserIdValueObject } from '../value-objects/user-id.value-object';
import { UserRegisteredEvent } from '../events/user-registered.event';

export class UserAggregate extends BaseAggregate {
  private readonly _id: UserIdValueObject;
  private readonly _email: string;
  private readonly _passwordHash: string;

  private constructor(
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

  static fromPrimitives(primitives: {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserAggregate {
    return new UserAggregate(
      new UserIdValueObject(primitives.id),
      primitives.email,
      primitives.passwordHash,
      new DateValueObject(primitives.createdAt),
      new DateValueObject(primitives.updatedAt),
    );
  }

  static async register(email: string, plainPassword: string): Promise<UserAggregate> {
    const passwordHash = await bcrypt.hash(plainPassword, 12);
    const now = new DateValueObject(new Date());
    const id = UserIdValueObject.generate();

    const user = new UserAggregate(id, email, passwordHash, now, now);
    user.apply(new UserRegisteredEvent(id.value, email));

    return user;
  }
}
