import { UserRoleEnum, UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserViewModel } from '../../domain/repositories/read/user-read.repository';

export class UserViewModelBuilder {
  private _id!: string;
  private _role!: UserRoleEnum;
  private _status!: UserStatusEnum;
  private _email?: string;
  private _createdAt!: Date;

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

  withEmail(email: string | undefined): this {
    this._email = email;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  build(): UserViewModel {
    if (!this._id) throw new Error('UserViewModelBuilder: id is required');
    if (!this._role) throw new Error('UserViewModelBuilder: role is required');
    if (!this._status)
      throw new Error('UserViewModelBuilder: status is required');
    if (!this._createdAt)
      throw new Error('UserViewModelBuilder: createdAt is required');

    return {
      id: this._id,
      role: this._role,
      status: this._status,
      email: this._email,
      createdAt: this._createdAt,
    };
  }
}
