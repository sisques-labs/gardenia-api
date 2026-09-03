import { Injectable } from '@nestjs/common';
import {
  IBaseService,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
import { PushSubscriptionAuthValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-auth/push-subscription-auth.value-object';
import { PushSubscriptionEndpointValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-endpoint/push-subscription-endpoint.value-object';
import { PushSubscriptionP256dhValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object';

export interface CreatePushSubscriptionServiceInput {
  userId: UuidValueObject;
  endpoint: PushSubscriptionEndpointValueObject;
  p256dh: PushSubscriptionP256dhValueObject;
  auth: PushSubscriptionAuthValueObject;
  userAgent: StringValueObject | null;
}

/** Builds and creates a brand-new subscription — the non-upsert path of RegisterPushSubscriptionCommand. */
@Injectable()
export class CreatePushSubscriptionService implements IBaseService<
  CreatePushSubscriptionServiceInput,
  PushSubscriptionAggregate
> {
  constructor(
    private readonly pushSubscriptionBuilder: PushSubscriptionBuilder,
  ) {}

  async execute(
    input: CreatePushSubscriptionServiceInput,
  ): Promise<PushSubscriptionAggregate> {
    const now = new Date();
    const subscriptionId = UuidValueObject.generate().value;

    const subscription = this.pushSubscriptionBuilder
      .withId(subscriptionId)
      .withUserId(input.userId.value)
      .withEndpoint(input.endpoint.value)
      .withP256dh(input.p256dh.value)
      .withAuth(input.auth.value)
      .withUserAgent(input.userAgent?.value ?? null)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    subscription.create();
    return subscription;
  }
}
