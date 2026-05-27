import { BaseAggregate, UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserAvatarUrlChangedEvent } from '@contexts/users/domain/events/field-changed/user-avatar-url-changed/user-avatar-url-changed.event';
import { UserBioChangedEvent } from '@contexts/users/domain/events/field-changed/user-bio-changed/user-bio-changed.event';
import { UserFirstNameChangedEvent } from '@contexts/users/domain/events/field-changed/user-first-name-changed/user-first-name-changed.event';
import { UserLastNameChangedEvent } from '@contexts/users/domain/events/field-changed/user-last-name-changed/user-last-name-changed.event';
import { UserLocaleChangedEvent } from '@contexts/users/domain/events/field-changed/user-locale-changed/user-locale-changed.event';
import { UserStatusChangedEvent } from '@contexts/users/domain/events/field-changed/user-status-changed/user-status-changed.event';
import { UserTimezoneChangedEvent } from '@contexts/users/domain/events/field-changed/user-timezone-changed/user-timezone-changed.event';
import { UserUsernameChangedEvent } from '@contexts/users/domain/events/field-changed/user-username-changed/user-username-changed.event';
import { UserUpdatedEvent } from '@contexts/users/domain/events/user-updated/user-updated.event';
import { BioExceedsMaxLengthException } from '@contexts/users/domain/exceptions/bio-exceeds-max-length.exception';
import { UserCreatedEvent } from '../events/user-created/user-created.event';
import { UserDeletedEvent } from '../events/user-deleted/user-deleted.event';
import { IUser } from '../interfaces/user.interface';
import { IUserPrimitives } from '../primitives/user.primitives';
import { UserIdValueObject } from '../value-objects/user-id/user-id.value-object';
import { UserStatusValueObject } from '../value-objects/user-status/user-status.vo';
import { UsernameValueObject } from '../value-objects/username/username.value-object';

export class UserAggregate extends BaseAggregate {
  private readonly _id: UserIdValueObject;
  private _status: UserStatusValueObject;
  private _username: UsernameValueObject;
  private _firstName: string | null;
  private _lastName: string | null;
  private _avatarUrl: string | null;
  private _bio: string | null;
  private _locale: string | null;
  private _timezone: string | null;

  constructor(props: IUser) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._status = props.status;
    this._username = props.username;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._avatarUrl = props.avatarUrl;
    this._bio = props.bio;
    this._locale = props.locale;
    this._timezone = props.timezone;

    this.apply(
      new UserCreatedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: UserAggregate.name,
          entityId: this.id.value,
          entityType: UserAggregate.name,
          eventType: UserCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public activate(): void {
    this.changeStatus(UserStatusEnum.ACTIVE);
  }

  public deactivate(): void {
    this.changeStatus(UserStatusEnum.INACTIVE);
  }

  public block(): void {
    this.changeStatus(UserStatusEnum.BLOCKED);
  }

  public update(
    props: Omit<Partial<IUser>, 'id' | 'createdAt' | 'updatedAt'>,
  ): void {
    if (props.status) {
      this.changeStatus(props.status.value as UserStatusEnum);
    }

    if (props.username) {
      this.changeUsername(props.username);
    }

    if (props.firstName !== undefined) {
      this.changeFirstName(props.firstName);
    }

    if (props.lastName !== undefined) {
      this.changeLastName(props.lastName);
    }

    if (props.avatarUrl !== undefined) {
      this.changeAvatarUrl(props.avatarUrl);
    }

    if (props.bio !== undefined) {
      this.changeBio(props.bio);
    }

    if (props.locale !== undefined) {
      this.changeLocale(props.locale);
    }

    if (props.timezone !== undefined) {
      this.changeTimezone(props.timezone);
    }

    this.apply(
      new UserUpdatedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: UserAggregate.name,
          entityId: this.id.value,
          entityType: UserAggregate.name,
          eventType: UserUpdatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public changeStatus(status: UserStatusEnum): void {
    const oldStatus = this._status.value;
    const newStatus = new UserStatusValueObject(status);

    this._status = newStatus;

    this.touch();

    this.apply(
      new UserStatusChangedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: UserAggregate.name,
          entityId: this.id.value,
          entityType: UserAggregate.name,
          eventType: UserStatusChangedEvent.name,
        },
        {
          id: this.id.value,
          oldValue: oldStatus as UserStatusEnum,
          newValue: status,
        },
      ),
    );
  }

  private changeUsername(newUsername: UsernameValueObject): void {
    if (this._username.equals(newUsername)) return;

    const oldValue = this._username.value;

    this._username = newUsername;
    this.touch();

    this.apply(
      new UserUsernameChangedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: UserAggregate.name,
          entityId: this.id.value,
          entityType: UserAggregate.name,
          eventType: UserUsernameChangedEvent.name,
        },
        {
          id: this.id.value,
          oldValue,
          newValue: newUsername.value,
        },
      ),
    );
  }

  private changeFirstName(newValue: string | null): void {
    if (this._firstName === newValue) return;

    const oldValue = this._firstName;
    this._firstName = newValue;
    this.touch();

    this.apply(
      new UserFirstNameChangedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: UserAggregate.name,
          entityId: this.id.value,
          entityType: UserAggregate.name,
          eventType: UserFirstNameChangedEvent.name,
        },
        {
          id: this.id.value,
          oldValue,
          newValue,
        },
      ),
    );
  }

  private changeLastName(newValue: string | null): void {
    if (this._lastName === newValue) return;

    const oldValue = this._lastName;
    this._lastName = newValue;
    this.touch();

    this.apply(
      new UserLastNameChangedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: UserAggregate.name,
          entityId: this.id.value,
          entityType: UserAggregate.name,
          eventType: UserLastNameChangedEvent.name,
        },
        {
          id: this.id.value,
          oldValue,
          newValue,
        },
      ),
    );
  }

  private changeAvatarUrl(newValue: string | null): void {
    if (this._avatarUrl === newValue) return;

    const oldValue = this._avatarUrl;
    this._avatarUrl = newValue;
    this.touch();

    this.apply(
      new UserAvatarUrlChangedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: UserAggregate.name,
          entityId: this.id.value,
          entityType: UserAggregate.name,
          eventType: UserAvatarUrlChangedEvent.name,
        },
        {
          id: this.id.value,
          oldValue,
          newValue,
        },
      ),
    );
  }

  private changeBio(newValue: string | null): void {
    if (
      newValue !== null &&
      newValue.length > BioExceedsMaxLengthException.MAX_LENGTH
    ) {
      throw new BioExceedsMaxLengthException(newValue.length);
    }

    if (this._bio === newValue) return;

    const oldValue = this._bio;
    this._bio = newValue;
    this.touch();

    this.apply(
      new UserBioChangedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: UserAggregate.name,
          entityId: this.id.value,
          entityType: UserAggregate.name,
          eventType: UserBioChangedEvent.name,
        },
        {
          id: this.id.value,
          oldValue,
          newValue,
        },
      ),
    );
  }

  private changeLocale(newValue: string | null): void {
    if (this._locale === newValue) return;

    const oldValue = this._locale;
    this._locale = newValue;
    this.touch();

    this.apply(
      new UserLocaleChangedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: UserAggregate.name,
          entityId: this.id.value,
          entityType: UserAggregate.name,
          eventType: UserLocaleChangedEvent.name,
        },
        {
          id: this.id.value,
          oldValue,
          newValue,
        },
      ),
    );
  }

  private changeTimezone(newValue: string | null): void {
    if (this._timezone === newValue) return;

    const oldValue = this._timezone;
    this._timezone = newValue;
    this.touch();

    this.apply(
      new UserTimezoneChangedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: UserAggregate.name,
          entityId: this.id.value,
          entityType: UserAggregate.name,
          eventType: UserTimezoneChangedEvent.name,
        },
        {
          id: this.id.value,
          oldValue,
          newValue,
        },
      ),
    );
  }

  public delete(): void {
    this.apply(
      new UserDeletedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: UserAggregate.name,
          entityId: this.id.value,
          entityType: UserAggregate.name,
          eventType: UserDeletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  get id(): UserIdValueObject {
    return this._id;
  }

  get status(): UserStatusValueObject {
    return this._status;
  }

  get username(): UsernameValueObject {
    return this._username;
  }

  get firstName(): string | null {
    return this._firstName;
  }

  get lastName(): string | null {
    return this._lastName;
  }

  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  get bio(): string | null {
    return this._bio;
  }

  get locale(): string | null {
    return this._locale;
  }

  get timezone(): string | null {
    return this._timezone;
  }

  toPrimitives(): IUserPrimitives {
    return {
      id: this._id.value,
      status: this._status.value,
      username: this._username.value,
      firstName: this._firstName,
      lastName: this._lastName,
      avatarUrl: this._avatarUrl,
      bio: this._bio,
      locale: this._locale,
      timezone: this._timezone,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
