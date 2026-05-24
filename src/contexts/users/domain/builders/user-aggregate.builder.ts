import {
  DateValueObject,
  UserRoleEnum,
  UserStatusEnum,
} from '@sisques-labs/nestjs-kit';

import { UserAggregate } from '../aggregates/user.aggregate';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserIdValueObject } from '../value-objects/user-id/user-id.value-object';

export class UserAggregateBuilder {
  private _id!: string;
  private _role!: UserRoleEnum;
  private _status!: UserStatusEnum;

  withId(id: string): this {
    this._id = id;
    return this;
  }

  withRole(role: UserRoleEnum): this {
    this._role = role;
    return this;
  }

  withStatus(status: UserStatusEnum): this {
    this._status = status;
    return this;
  }

  build(): UserAggregate {
    if (!this._id) throw new Error('UserAggregateBuilder: id is required');
    if (!this._role) throw new Error('UserAggregateBuilder: role is required');
    if (!this._status)
      throw new Error('UserAggregateBuilder: status is required');

    const now = new DateValueObject(new Date());
    const user = new UserAggregate(
      new UserIdValueObject(this._id),
      this._role,
      this._status,
      now,
      now,
    );
    user.apply(new UserCreatedEvent(this._id, this._role, this._status));

    return user;
  }
}

export class UserAggregateReconstructBuilder {
  private _id!: string;
  private _role!: UserRoleEnum;
  private _status!: UserStatusEnum;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  withId(id: string): this {
    this._id = id;
    return this;
  }

  withRole(role: UserRoleEnum): this {
    this._role = role;
    return this;
  }

  withStatus(status: UserStatusEnum): this {
    this._status = status;
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
    if (!this._id)
      throw new Error('UserAggregateReconstructBuilder: id is required');
    if (!this._role)
      throw new Error('UserAggregateReconstructBuilder: role is required');
    if (!this._status)
      throw new Error('UserAggregateReconstructBuilder: status is required');

    return new UserAggregate(
      new UserIdValueObject(this._id),
      this._role,
      this._status,
      new DateValueObject(this._createdAt ?? new Date()),
      new DateValueObject(this._updatedAt ?? new Date()),
    );
  }
}
