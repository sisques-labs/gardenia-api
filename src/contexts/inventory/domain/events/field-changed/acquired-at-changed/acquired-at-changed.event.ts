import {
  BaseEvent,
  IEventMetadata,
  IFieldChangedEventData,
} from '@sisques-labs/nestjs-kit';

export class InventoryItemAcquiredAtChangedEvent extends BaseEvent<
  IFieldChangedEventData<Date | null>
> {
  constructor(
    metadata: IEventMetadata,
    data: IFieldChangedEventData<Date | null>,
  ) {
    super(metadata, data);
  }
}
