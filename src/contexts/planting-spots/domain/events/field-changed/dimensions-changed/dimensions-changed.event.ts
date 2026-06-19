import {
  BaseEvent,
  IEventMetadata,
  IFieldChangedEventData,
} from '@sisques-labs/nestjs-kit';

export interface IDimensionsValue {
  width: number | null;
  height: number | null;
  length: number | null;
}

export class PlantingSpotDimensionsChangedEvent extends BaseEvent<
  IFieldChangedEventData<IDimensionsValue | null>
> {
  constructor(
    metadata: IEventMetadata,
    data: IFieldChangedEventData<IDimensionsValue | null>,
  ) {
    super(metadata, data);
  }
}
