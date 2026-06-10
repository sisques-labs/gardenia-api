import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export interface TaskRescheduledEventData {
  id: string;
  userId: string;
  oldScheduledAt: Date | null;
  newScheduledAt: Date;
}

export class TaskRescheduledEvent extends BaseEvent<TaskRescheduledEventData> {
  constructor(metadata: IEventMetadata, data: TaskRescheduledEventData) {
    super(metadata, data);
  }
}
