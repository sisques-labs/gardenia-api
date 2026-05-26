import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';
import { UserStatusValueObject } from '@contexts/users/domain/value-objects/user-status/user-status.vo';
import { UsernameValueObject } from '@contexts/users/domain/value-objects/username/username.value-object';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
} from '@sisques-labs/nestjs-kit';

@Injectable()
export class UserBuilder extends BaseBuilder<UserAggregate, UserViewModel> {
  private _status!: string;
  private _username!: string;

  withStatus(status: string): this {
    this._status = status;
    return this;
  }

  withUsername(username: string): this {
    this._username = username;
    return this;
  }

  public override buildViewModel(): UserViewModel {
    this.validate();

    return new UserViewModel({
      id: this._id,
      status: this._status,
      username: this._username,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override build(): UserAggregate {
    this.validate();

    return new UserAggregate({
      id: new UserIdValueObject(this._id),
      status: new UserStatusValueObject(this._status as UserStatusEnum),
      username: new UsernameValueObject(this._username),
      createdAt: new DateValueObject(this._createdAt ?? new Date()),
      updatedAt: new DateValueObject(this._updatedAt ?? new Date()),
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._status) throw new FieldIsRequiredException('status');
    if (!this._username) throw new FieldIsRequiredException('username');
  }
}
