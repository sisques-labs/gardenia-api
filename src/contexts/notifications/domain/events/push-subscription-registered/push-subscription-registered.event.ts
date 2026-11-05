import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IPushSubscriptionEventData } from '@contexts/notifications/domain/events/interfaces/push-subscription-event-data.interface';

export class PushSubscriptionRegisteredEvent extends BaseEvent<IPushSubscriptionEventData> {
  constructor(metadata: IEventMetadata, data: IPushSubscriptionEventData) {
    super(metadata, data);
  }
}
