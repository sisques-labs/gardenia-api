import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IPlantSpeciesEventData } from '@contexts/plant-species/domain/events/interfaces/plant-species-event-data.interface';

export class PlantSpeciesDeletedEvent extends BaseEvent<IPlantSpeciesEventData> {
  constructor(metadata: IEventMetadata, data: IPlantSpeciesEventData) {
    super(metadata, data);
  }
}
