import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import { NoPushSubscriptionsForUserException } from '@contexts/notifications/domain/exceptions/no-push-subscriptions-for-user.exception';
import {
  IPushSubscriptionWriteRepository,
  PUSH_SUBSCRIPTION_WRITE_REPOSITORY,
} from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

@Injectable()
export class AssertUserHasPushSubscriptionsService implements IBaseService<
  string,
  PushSubscriptionAggregate[]
> {
  constructor(
    @Inject(PUSH_SUBSCRIPTION_WRITE_REPOSITORY)
    private readonly pushSubscriptionWriteRepository: IPushSubscriptionWriteRepository,
  ) {}

  async execute(userId: string): Promise<PushSubscriptionAggregate[]> {
    const subscriptions =
      await this.pushSubscriptionWriteRepository.findByUserId(userId);

    if (subscriptions.length === 0) {
      throw new NoPushSubscriptionsForUserException(userId);
    }

    return subscriptions;
  }
}
