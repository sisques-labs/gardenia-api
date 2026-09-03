import {
  BaseAggregate,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PushSubscriptionRegisteredEvent } from '@contexts/notifications/domain/events/push-subscription-registered/push-subscription-registered.event';
import { PushSubscriptionUnregisteredEvent } from '@contexts/notifications/domain/events/push-subscription-unregistered/push-subscription-unregistered.event';
import { IPushSubscription } from '@contexts/notifications/domain/interfaces/push-subscription.interface';
import { IPushSubscriptionPrimitives } from '@contexts/notifications/domain/primitives/push-subscription.primitives';
import { PushSubscriptionAuthValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-auth/push-subscription-auth.value-object';
import { PushSubscriptionEndpointValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-endpoint/push-subscription-endpoint.value-object';
import { PushSubscriptionIdValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-id/push-subscription-id.value-object';
import { PushSubscriptionP256dhValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object';

export class PushSubscriptionAggregate extends BaseAggregate {
  private readonly _id: PushSubscriptionIdValueObject;
  private readonly _endpoint: PushSubscriptionEndpointValueObject;
  private _userId: UuidValueObject;
  private _p256dh: PushSubscriptionP256dhValueObject;
  private _auth: PushSubscriptionAuthValueObject;
  private _userAgent: StringValueObject | null;

  constructor(props: IPushSubscription) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._endpoint = props.endpoint;
    this._userId = props.userId;
    this._p256dh = props.p256dh;
    this._auth = props.auth;
    this._userAgent = props.userAgent;
  }

  public create(): void {
    this.apply(
      new PushSubscriptionRegisteredEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PushSubscriptionAggregate.name,
          entityId: this._id.value,
          entityType: PushSubscriptionAggregate.name,
          eventType: PushSubscriptionRegisteredEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  /**
   * Re-points an existing subscription (matched by endpoint) at its latest
   * owner and keys. No domain event — this is upsert bookkeeping, not a
   * user-facing fact.
   */
  public reassign(
    userId: UuidValueObject,
    p256dh: PushSubscriptionP256dhValueObject,
    auth: PushSubscriptionAuthValueObject,
    userAgent: StringValueObject | null,
  ): void {
    this._userId = userId;
    this._p256dh = p256dh;
    this._auth = auth;
    this._userAgent = userAgent;
    this.touch();
  }

  public delete(): void {
    this.apply(
      new PushSubscriptionUnregisteredEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PushSubscriptionAggregate.name,
          entityId: this._id.value,
          entityType: PushSubscriptionAggregate.name,
          eventType: PushSubscriptionUnregisteredEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public toPrimitives(): IPushSubscriptionPrimitives {
    return {
      id: this._id.value,
      userId: this._userId.value,
      endpoint: this._endpoint.value,
      p256dh: this._p256dh.value,
      auth: this._auth.value,
      userAgent: this._userAgent?.value ?? null,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): PushSubscriptionIdValueObject {
    return this._id;
  }
  get userId(): UuidValueObject {
    return this._userId;
  }
  get endpoint(): PushSubscriptionEndpointValueObject {
    return this._endpoint;
  }
  get p256dh(): PushSubscriptionP256dhValueObject {
    return this._p256dh;
  }
  get auth(): PushSubscriptionAuthValueObject {
    return this._auth;
  }
  get userAgent(): StringValueObject | null {
    return this._userAgent;
  }
}
