import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ITaskJobFailedEventData } from '@core/queue/domain/events/interfaces/task-job-event-data.interface';

export class TaskJobFailedEvent extends BaseEvent<ITaskJobFailedEventData> {
  constructor(metadata: IEventMetadata, data: ITaskJobFailedEventData) {
    super(metadata, data);
  }
}
