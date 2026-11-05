import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';

export const PUSH_SUBSCRIPTION_WRITE_REPOSITORY = Symbol(
  'PUSH_SUBSCRIPTION_WRITE_REPOSITORY',
);

export interface IPushSubscriptionWriteRepository extends IBaseWriteRepository<PushSubscriptionAggregate> {
  findByEndpoint(endpoint: string): Promise<PushSubscriptionAggregate | null>;
  findByUserId(userId: string): Promise<PushSubscriptionAggregate[]>;
}
