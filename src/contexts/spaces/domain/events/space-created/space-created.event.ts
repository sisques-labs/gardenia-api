import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ISpaceEventData } from '../interfaces/space-event-data.interface';

export class SpaceCreatedEvent extends BaseEvent<ISpaceEventData> {
  constructor(metadata: IEventMetadata, data: ISpaceEventData) {
    super(metadata, data);
  }
}
