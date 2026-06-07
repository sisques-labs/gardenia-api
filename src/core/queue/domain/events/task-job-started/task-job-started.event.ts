import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ITaskJobStartedEventData } from '@core/queue/domain/events/interfaces/task-job-event-data.interface';

export class TaskJobStartedEvent extends BaseEvent<ITaskJobStartedEventData> {
  constructor(metadata: IEventMetadata, data: ITaskJobStartedEventData) {
    super(metadata, data);
  }
}
