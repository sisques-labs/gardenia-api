import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IPlantingSpotEventData } from '../interfaces/planting-spot-event-data.interface';

export class PlantingSpotCreatedEvent extends BaseEvent<IPlantingSpotEventData> {
  constructor(metadata: IEventMetadata, data: IPlantingSpotEventData) {
    super(metadata, data);
  }
}
