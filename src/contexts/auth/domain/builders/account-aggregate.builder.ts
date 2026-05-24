import * as bcrypt from 'bcrypt';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { AccountAggregate } from '../aggregates/account.aggregate';
import { AccountCreatedEvent } from '../events/account-created.event';

export class AccountAggregateBuilder {
  private _userId!: string;
  private _email!: string;
  private _password!: string;

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withEmail(email: string): this {
    this._email = email;
    return this;
  }

  withPassword(password: string): this {
    this._password = password;
    return this;
  }

  async build(): Promise<AccountAggregate> {
    if (!this._userId) throw new Error('AccountAggregateBuilder: userId is required');
    if (!this._email) throw new Error('AccountAggregateBuilder: email is required');
    if (!this._password) throw new Error('AccountAggregateBuilder: password is required');

    const passwordHash = await bcrypt.hash(this._password, 12);
    const now = new DateValueObject(new Date());
    const id = UuidValueObject.generate();

    const account = new AccountAggregate(id, this._userId, this._email, passwordHash, now, now);
    account.apply(new AccountCreatedEvent(id.value, this._userId, this._email));

    return account;
  }
}

export class AccountAggregateReconstructBuilder {
  private _id!: string;
  private _userId!: string;
  private _email!: string;
  private _passwordHash!: string;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  withId(id: string): this {
    this._id = id;
    return this;
  }

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

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this._updatedAt = updatedAt;
    return this;
  }

  build(): AccountAggregate {
    if (!this._id) throw new Error('AccountAggregateReconstructBuilder: id is required');
    if (!this._userId) throw new Error('AccountAggregateReconstructBuilder: userId is required');
    if (!this._email) throw new Error('AccountAggregateReconstructBuilder: email is required');
    if (!this._passwordHash) throw new Error('AccountAggregateReconstructBuilder: passwordHash is required');

    return new AccountAggregate(
      new UuidValueObject(this._id),
      this._userId,
      this._email,
      this._passwordHash,
      new DateValueObject(this._createdAt ?? new Date()),
      new DateValueObject(this._updatedAt ?? new Date()),
    );
  }
}
