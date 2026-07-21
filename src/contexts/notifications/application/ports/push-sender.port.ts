import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import { PushPayload } from '@contexts/notifications/application/ports/interfaces/push-payload.interface';

export const PUSH_SENDER_PORT = Symbol('PUSH_SENDER_PORT');

export interface IPushSenderPort {
  send(
    subscription: PushSubscriptionAggregate,
    payload: PushPayload,
  ): Promise<void>;
}
