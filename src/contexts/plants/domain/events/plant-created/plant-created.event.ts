import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IPlantEventData } from '../interfaces/plant-event-data.interface';

export class PlantCreatedEvent extends BaseEvent<IPlantEventData> {
  constructor(metadata: IEventMetadata, data: IPlantEventData) {
    super(metadata, data);
  }
}
