import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ITaskJobEventData } from '@core/queue/domain/events/interfaces/task-job-event-data.interface';

export class TaskJobCompletedEvent extends BaseEvent<ITaskJobEventData> {
  constructor(metadata: IEventMetadata, data: ITaskJobEventData) {
    super(metadata, data);
  }
}
