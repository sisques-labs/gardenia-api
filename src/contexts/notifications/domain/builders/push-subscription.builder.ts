import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import { PushSubscriptionViewModel } from '@contexts/notifications/domain/view-models/push-subscription.view-model';
import { PushSubscriptionAuthValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-auth/push-subscription-auth.value-object';
import { PushSubscriptionEndpointValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-endpoint/push-subscription-endpoint.value-object';
import { PushSubscriptionIdValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-id/push-subscription-id.value-object';
import { PushSubscriptionP256dhValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object';

@Injectable()
export class PushSubscriptionBuilder extends BaseBuilder<
  PushSubscriptionAggregate,
  PushSubscriptionViewModel
> {
  private _userId!: string;
  private _endpoint!: string;
  private _p256dh!: string;
  private _auth!: string;
  private _userAgent: string | null = null;

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withEndpoint(endpoint: string): this {
    this._endpoint = endpoint;
    return this;
  }

  withP256dh(p256dh: string): this {
    this._p256dh = p256dh;
    return this;
  }

  withAuth(auth: string): this {
    this._auth = auth;
    return this;
  }

  withUserAgent(userAgent: string | null): this {
    this._userAgent = userAgent;
    return this;
  }

  public override build(): PushSubscriptionAggregate {
    this.validate();
    return new PushSubscriptionAggregate({
      id: new PushSubscriptionIdValueObject(this._id),
      userId: new UuidValueObject(this._userId),
      endpoint: new PushSubscriptionEndpointValueObject(this._endpoint),
      p256dh: new PushSubscriptionP256dhValueObject(this._p256dh),
      auth: new PushSubscriptionAuthValueObject(this._auth),
      userAgent:
        this._userAgent != null ? new StringValueObject(this._userAgent) : null,
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): PushSubscriptionViewModel {
    this.validate();
    return new PushSubscriptionViewModel({
      id: this._id,
      userId: this._userId,
      endpoint: this._endpoint,
      p256dh: this._p256dh,
      auth: this._auth,
      userAgent: this._userAgent,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._endpoint) throw new FieldIsRequiredException('endpoint');
    if (!this._p256dh) throw new FieldIsRequiredException('p256dh');
    if (!this._auth) throw new FieldIsRequiredException('auth');
  }
}
