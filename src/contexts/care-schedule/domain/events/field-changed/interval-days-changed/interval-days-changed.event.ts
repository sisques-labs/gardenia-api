import {
  BaseEvent,
  IEventMetadata,
  IFieldChangedEventData,
} from '@sisques-labs/nestjs-kit';

export class CareScheduleIntervalDaysChangedEvent extends BaseEvent<
  IFieldChangedEventData<number>
> {
  constructor(metadata: IEventMetadata, data: IFieldChangedEventData<number>) {
    super(metadata, data);
  }
}
