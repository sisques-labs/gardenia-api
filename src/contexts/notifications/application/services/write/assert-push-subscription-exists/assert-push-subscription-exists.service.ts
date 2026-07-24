import { Inject, Injectable } from '@nestjs/common';

import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import { PushSubscriptionNotFoundException } from '@contexts/notifications/domain/exceptions/push-subscription-not-found.exception';
import {
  IPushSubscriptionWriteRepository,
  PUSH_SUBSCRIPTION_WRITE_REPOSITORY,
} from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';
import { PushSubscriptionIdValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-id/push-subscription-id.value-object';

@Injectable()
export class AssertPushSubscriptionExistsService {
  constructor(
    @Inject(PUSH_SUBSCRIPTION_WRITE_REPOSITORY)
    private readonly pushSubscriptionWriteRepository: IPushSubscriptionWriteRepository,
  ) {}

  async execute(
    id: PushSubscriptionIdValueObject,
  ): Promise<PushSubscriptionAggregate> {
    const subscription = await this.pushSubscriptionWriteRepository.findById(
      id.value,
    );
    if (!subscription) throw new PushSubscriptionNotFoundException(id.value);
    return subscription;
  }
}
