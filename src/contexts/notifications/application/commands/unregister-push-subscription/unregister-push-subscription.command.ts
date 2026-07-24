import { IPushSubscriptionPrimitives } from '@contexts/notifications/domain/primitives/push-subscription.primitives';
import { PushSubscriptionIdValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-id/push-subscription-id.value-object';

export type UnregisterPushSubscriptionCommandInput = Pick<
  IPushSubscriptionPrimitives,
  'id'
>;

export class UnregisterPushSubscriptionCommand {
  public readonly id: PushSubscriptionIdValueObject;

  constructor(input: UnregisterPushSubscriptionCommandInput) {
    this.id = new PushSubscriptionIdValueObject(input.id);
  }
}
