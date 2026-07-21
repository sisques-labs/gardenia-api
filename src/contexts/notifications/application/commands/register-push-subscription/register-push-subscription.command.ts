import { StringValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IPushSubscriptionPrimitives } from '@contexts/notifications/domain/primitives/push-subscription.primitives';
import { PushSubscriptionAuthValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-auth/push-subscription-auth.value-object';
import { PushSubscriptionEndpointValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-endpoint/push-subscription-endpoint.value-object';
import { PushSubscriptionP256dhValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object';

export type RegisterPushSubscriptionCommandInput = Pick<
  IPushSubscriptionPrimitives,
  'userId' | 'endpoint' | 'p256dh' | 'auth'
> &
  Partial<Pick<IPushSubscriptionPrimitives, 'userAgent'>>;

export class RegisterPushSubscriptionCommand {
  public readonly userId: UuidValueObject;
  public readonly endpoint: PushSubscriptionEndpointValueObject;
  public readonly p256dh: PushSubscriptionP256dhValueObject;
  public readonly auth: PushSubscriptionAuthValueObject;
  public readonly userAgent: StringValueObject | null;

  constructor(input: RegisterPushSubscriptionCommandInput) {
    this.userId = new UuidValueObject(input.userId);
    this.endpoint = new PushSubscriptionEndpointValueObject(input.endpoint);
    this.p256dh = new PushSubscriptionP256dhValueObject(input.p256dh);
    this.auth = new PushSubscriptionAuthValueObject(input.auth);
    this.userAgent = input.userAgent
      ? new StringValueObject(input.userAgent)
      : null;
  }
}
