import {
  BaseEvent,
  IEventMetadata,
  IFieldChangedEventData,
} from '@sisques-labs/nestjs-kit';

export class CareScheduleActiveChangedEvent extends BaseEvent<
  IFieldChangedEventData<boolean>
> {
  constructor(metadata: IEventMetadata, data: IFieldChangedEventData<boolean>) {
    super(metadata, data);
  }
}
