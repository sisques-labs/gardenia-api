import { BaseAggregate, UserStatusEnum } from '@sisques-labs/nestjs-kit';

import { UserStatusChangedEvent } from '@contexts/users/domain/events/field-changed/user-status-changed/user-status-changed.event';
import { UserUpdatedEvent } from '@contexts/users/domain/events/user-updated/user-updated.event';
import { UserCreatedEvent } from '../events/user-created/user-created.event';
import { UserDeletedEvent } from '../events/user-deleted/user-deleted.event';
import { IUser } from '../interfaces/user.interface';
import { IUserPrimitives } from '../primitives/user.primitives';
import { UserIdValueObject } from '../value-objects/user-id/user-id.value-object';
import { UserStatusValueObject } from '../value-objects/user-status/user-status.vo';

export class UserAggregate extends BaseAggregate {
  private readonly _id: UserIdValueObject;
  private _status: UserStatusValueObject;

  constructor(props: IUser) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._status = props.status;

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

  toPrimitives(): IUserPrimitives {
    return {
      id: this._id.value,
      status: this._status.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
