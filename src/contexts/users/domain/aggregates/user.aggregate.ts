import { BaseAggregate } from '@sisques-labs/nestjs-kit';

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
