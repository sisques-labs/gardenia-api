import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IBridgeEventData } from '../interfaces/bridge-event-data.interface';

export class BridgeClaimedEvent extends BaseEvent<IBridgeEventData> {
  constructor(metadata: IEventMetadata, data: IBridgeEventData) {
    super(metadata, data);
  }
}
