import { BaseAggregate, DateValueObject, UserRoleEnum, UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserIdValueObject } from '../value-objects/user-id.value-object';

export class UserAggregate extends BaseAggregate {
  private readonly _id: UserIdValueObject;
  private readonly _role: UserRoleEnum;
  private readonly _status: UserStatusEnum;

  constructor(
    id: UserIdValueObject,
    role: UserRoleEnum,
    status: UserStatusEnum,
    createdAt: DateValueObject,
    updatedAt: DateValueObject,
  ) {
    super(createdAt, updatedAt);
    this._id = id;
    this._role = role;
    this._status = status;
  }

  get id(): UserIdValueObject {
    return this._id;
  }

  get role(): UserRoleEnum {
    return this._role;
  }

  get status(): UserStatusEnum {
    return this._status;
  }

  toPrimitives(): {
    id: string;
    role: UserRoleEnum;
    status: UserStatusEnum;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this._id.value,
      role: this._role,
      status: this._status,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
