import {
  BaseEvent,
  IEventMetadata,
  IFieldChangedEventData,
} from '@sisques-labs/nestjs-kit';

export class TaskTemplateHandlerKeyChangedEvent extends BaseEvent<
  IFieldChangedEventData<string>
> {
  constructor(metadata: IEventMetadata, data: IFieldChangedEventData<string>) {
    super(metadata, data);
  }
}
