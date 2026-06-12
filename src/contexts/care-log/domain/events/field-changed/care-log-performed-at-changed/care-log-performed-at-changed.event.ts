import {
  BaseEvent,
  IEventMetadata,
  IFieldChangedEventData,
} from '@sisques-labs/nestjs-kit';

export class CareLogPerformedAtChangedEvent extends BaseEvent<
  IFieldChangedEventData<Date>
> {
  constructor(metadata: IEventMetadata, data: IFieldChangedEventData<Date>) {
    super(metadata, data);
  }
}
