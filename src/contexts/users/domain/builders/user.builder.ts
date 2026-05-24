import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';
import { UserStatusValueObject } from '@contexts/users/domain/value-objects/user-status/user-status.vo';
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

  withStatus(status: string): this {
    this._status = status;
    return this;
  }

  public override buildViewModel(): UserViewModel {
    this.validate();

    return new UserViewModel({
      id: this._id,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override build(): UserAggregate {
    this.validate();

    return new UserAggregate({
      id: new UserIdValueObject(this._id),
      status: new UserStatusValueObject(this._status as UserStatusEnum),
      createdAt: new DateValueObject(this._createdAt ?? new Date()),
      updatedAt: new DateValueObject(this._updatedAt ?? new Date()),
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._status) throw new FieldIsRequiredException('status');
  }
}
