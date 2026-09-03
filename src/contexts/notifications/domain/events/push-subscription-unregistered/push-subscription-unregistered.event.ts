import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IPushSubscriptionEventData } from '@contexts/notifications/domain/events/interfaces/push-subscription-event-data.interface';

export class PushSubscriptionUnregisteredEvent extends BaseEvent<IPushSubscriptionEventData> {
  constructor(metadata: IEventMetadata, data: IPushSubscriptionEventData) {
    super(metadata, data);
  }
}
