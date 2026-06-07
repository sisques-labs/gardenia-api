import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ITaskFailedEventData } from '@contexts/tasks/domain/events/task-failed/task-failed.event';

export class TaskSentToDlqEvent extends BaseEvent<ITaskFailedEventData> {
  constructor(metadata: IEventMetadata, data: ITaskFailedEventData) {
    super(metadata, data);
  }
}
