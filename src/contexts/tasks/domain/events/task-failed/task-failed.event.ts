import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ITaskEventData } from '@contexts/tasks/domain/events/interfaces/task-event-data.interface';

export interface ITaskFailedEventData extends ITaskEventData {
  error: string;
}

export class TaskFailedEvent extends BaseEvent<ITaskFailedEventData> {
  constructor(metadata: IEventMetadata, data: ITaskFailedEventData) {
    super(metadata, data);
  }
}
