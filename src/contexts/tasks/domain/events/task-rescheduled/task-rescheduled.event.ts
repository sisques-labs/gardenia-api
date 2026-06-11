import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ITaskRescheduledEventData } from '@contexts/tasks/domain/events/interfaces/task-rescheduled-event-data.interface';

export class TaskRescheduledEvent extends BaseEvent<ITaskRescheduledEventData> {
  constructor(metadata: IEventMetadata, data: ITaskRescheduledEventData) {
    super(metadata, data);
  }
}
