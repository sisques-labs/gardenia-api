import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ITaskEventData } from '@contexts/tasks/domain/events/interfaces/task-event-data.interface';

export class TaskFailedEvent extends BaseEvent<ITaskEventData> {
  constructor(metadata: IEventMetadata, data: ITaskEventData) {
    super(metadata, data);
  }
}
