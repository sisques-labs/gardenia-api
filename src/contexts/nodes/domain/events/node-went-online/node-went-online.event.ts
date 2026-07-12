import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { INodeEventData } from '../interfaces/node-event-data.interface';

export class NodeWentOnlineEvent extends BaseEvent<INodeEventData> {
  constructor(metadata: IEventMetadata, data: INodeEventData) {
    super(metadata, data);
  }
}
