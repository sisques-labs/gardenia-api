import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { PushSubscriptionViewModel } from '@contexts/notifications/domain/view-models/push-subscription.view-model';

export const PUSH_SUBSCRIPTION_READ_REPOSITORY = Symbol(
  'PUSH_SUBSCRIPTION_READ_REPOSITORY',
);

export type IPushSubscriptionReadRepository =
  IBaseReadRepository<PushSubscriptionViewModel>;
