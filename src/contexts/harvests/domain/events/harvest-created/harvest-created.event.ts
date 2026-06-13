import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IHarvestEventData } from '@contexts/harvests/domain/events/interfaces/harvest-event-data.interface';

export class HarvestCreatedEvent extends BaseEvent<IHarvestEventData> {
  constructor(metadata: IEventMetadata, data: IHarvestEventData) {
    super(metadata, data);
  }
}
