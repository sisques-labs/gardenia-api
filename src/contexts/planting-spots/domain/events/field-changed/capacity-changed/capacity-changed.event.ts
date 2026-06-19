import {
  BaseEvent,
  IEventMetadata,
  IFieldChangedEventData,
} from '@sisques-labs/nestjs-kit';

export class PlantingSpotCapacityChangedEvent extends BaseEvent<
  IFieldChangedEventData<number | null>
> {
  constructor(
    metadata: IEventMetadata,
    data: IFieldChangedEventData<number | null>,
  ) {
    super(metadata, data);
  }
}
