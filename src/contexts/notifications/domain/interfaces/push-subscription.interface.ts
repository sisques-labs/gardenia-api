import {
  DateValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PushSubscriptionAuthValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-auth/push-subscription-auth.value-object';
import { PushSubscriptionEndpointValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-endpoint/push-subscription-endpoint.value-object';
import { PushSubscriptionIdValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-id/push-subscription-id.value-object';
import { PushSubscriptionP256dhValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object';

export interface IPushSubscription {
  id: PushSubscriptionIdValueObject;
  userId: UuidValueObject;
  endpoint: PushSubscriptionEndpointValueObject;
  p256dh: PushSubscriptionP256dhValueObject;
  auth: PushSubscriptionAuthValueObject;
  userAgent: StringValueObject | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
