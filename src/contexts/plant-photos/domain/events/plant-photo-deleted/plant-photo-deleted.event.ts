import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IPlantPhotoEventData } from '@contexts/plant-photos/domain/events/interfaces/plant-photo-event-data.interface';

export class PlantPhotoDeletedEvent extends BaseEvent<IPlantPhotoEventData> {
  constructor(metadata: IEventMetadata, data: IPlantPhotoEventData) {
    super(metadata, data);
  }
}
