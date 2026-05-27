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
  private _firstName: string | null = null;
  private _lastName: string | null = null;
  private _avatarUrl: string | null = null;
  private _bio: string | null = null;
  private _locale: string | null = null;
  private _timezone: string | null = null;

  withStatus(status: string): this {
    this._status = status;
    return this;
  }

  withUsername(username: string): this {
    this._username = username;
    return this;
  }

  withFirstName(firstName: string | null): this {
    this._firstName = firstName;
    return this;
  }

  withLastName(lastName: string | null): this {
    this._lastName = lastName;
    return this;
  }

  withAvatarUrl(avatarUrl: string | null): this {
    this._avatarUrl = avatarUrl;
    return this;
  }

  withBio(bio: string | null): this {
    this._bio = bio;
    return this;
  }

  withLocale(locale: string | null): this {
    this._locale = locale;
    return this;
  }

  withTimezone(timezone: string | null): this {
    this._timezone = timezone;
    return this;
  }

  public override buildViewModel(): UserViewModel {
    this.validate();

    return new UserViewModel({
      id: this._id,
      status: this._status,
      username: this._username,
      firstName: this._firstName,
      lastName: this._lastName,
      avatarUrl: this._avatarUrl,
      bio: this._bio,
      locale: this._locale,
      timezone: this._timezone,
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
      firstName: this._firstName,
      lastName: this._lastName,
      avatarUrl: this._avatarUrl,
      bio: this._bio,
      locale: this._locale,
      timezone: this._timezone,
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
