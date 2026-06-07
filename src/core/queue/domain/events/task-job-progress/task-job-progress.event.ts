import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ITaskJobProgressEventData } from '@core/queue/domain/events/interfaces/task-job-event-data.interface';

export class TaskJobProgressEvent extends BaseEvent<ITaskJobProgressEventData> {
  constructor(metadata: IEventMetadata, data: ITaskJobProgressEventData) {
    super(metadata, data);
  }
}
