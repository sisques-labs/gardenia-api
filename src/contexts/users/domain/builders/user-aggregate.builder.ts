import * as bcrypt from 'bcrypt';
import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { UserAggregate } from '../aggregates/user.aggregate';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { UserIdValueObject } from '../value-objects/user-id.value-object';

export class UserAggregateBuilder {
  private _email!: string;
  private _password!: string;

  withEmail(email: string): this {
    this._email = email;
    return this;
  }

  withPassword(password: string): this {
    this._password = password;
    return this;
  }

  async build(): Promise<UserAggregate> {
    if (!this._email) throw new Error('UserAggregateBuilder: email is required');
    if (!this._password) throw new Error('UserAggregateBuilder: password is required');

    const passwordHash = await bcrypt.hash(this._password, 12);
    const now = new DateValueObject(new Date());
    const id = UserIdValueObject.generate();

    const user = new UserAggregate(id, this._email, passwordHash, now, now);
    user.apply(new UserRegisteredEvent(id.value, this._email));

    return user;
  }
}

export class UserAggregateReconstructBuilder {
  private _id!: string;
  private _email!: string;
  private _passwordHash!: string;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  withId(id: string): this {
    this._id = id;
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

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this._updatedAt = updatedAt;
    return this;
  }

  build(): UserAggregate {
    if (!this._id) throw new Error('UserAggregateReconstructBuilder: id is required');
    if (!this._email) throw new Error('UserAggregateReconstructBuilder: email is required');
    if (!this._passwordHash) throw new Error('UserAggregateReconstructBuilder: passwordHash is required');

    return new UserAggregate(
      new UserIdValueObject(this._id),
      this._email,
      this._passwordHash,
      new DateValueObject(this._createdAt ?? new Date()),
      new DateValueObject(this._updatedAt ?? new Date()),
    );
  }
}
