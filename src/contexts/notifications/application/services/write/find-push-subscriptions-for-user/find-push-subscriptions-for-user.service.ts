import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import {
  IPushSubscriptionWriteRepository,
  PUSH_SUBSCRIPTION_WRITE_REPOSITORY,
} from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

/**
 * Loads every subscription registered for a user. An empty result is a
 * valid, non-exceptional state (the user simply hasn't opted in yet) — this
 * does NOT throw, unlike the assert-*-exists services in this codebase.
 */
@Injectable()
export class FindPushSubscriptionsForUserService implements IBaseService<
  string,
  PushSubscriptionAggregate[]
> {
  constructor(
    @Inject(PUSH_SUBSCRIPTION_WRITE_REPOSITORY)
    private readonly pushSubscriptionWriteRepository: IPushSubscriptionWriteRepository,
  ) {}

  async execute(userId: string): Promise<PushSubscriptionAggregate[]> {
    return this.pushSubscriptionWriteRepository.findByUserId(userId);
  }
}
