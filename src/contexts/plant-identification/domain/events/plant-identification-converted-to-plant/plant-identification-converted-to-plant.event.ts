import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IPlantIdentificationEventData } from '@contexts/plant-identification/domain/events/interfaces/plant-identification-event-data.interface';

export class PlantIdentificationConvertedToPlantEvent extends BaseEvent<IPlantIdentificationEventData> {
  constructor(metadata: IEventMetadata, data: IPlantIdentificationEventData) {
    super(metadata, data);
  }
}
