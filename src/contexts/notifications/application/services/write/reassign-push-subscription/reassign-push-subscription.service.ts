import { Injectable } from '@nestjs/common';
import {
  IBaseService,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import { PushSubscriptionAuthValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-auth/push-subscription-auth.value-object';
import { PushSubscriptionP256dhValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object';

export interface ReassignPushSubscriptionServiceInput {
  existing: PushSubscriptionAggregate;
  userId: UuidValueObject;
  p256dh: PushSubscriptionP256dhValueObject;
  auth: PushSubscriptionAuthValueObject;
  userAgent: StringValueObject | null;
}

/**
 * Re-points an existing subscription (matched by endpoint) at its latest
 * owner and keys — the upsert path of RegisterPushSubscriptionCommand.
 */
@Injectable()
export class ReassignPushSubscriptionService implements IBaseService<
  ReassignPushSubscriptionServiceInput,
  PushSubscriptionAggregate
> {
  async execute(
    input: ReassignPushSubscriptionServiceInput,
  ): Promise<PushSubscriptionAggregate> {
    input.existing.reassign(
      input.userId,
      input.p256dh,
      input.auth,
      input.userAgent,
    );
    return input.existing;
  }
}
