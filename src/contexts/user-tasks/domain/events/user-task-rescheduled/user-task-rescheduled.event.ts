import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export interface IUserTaskRescheduledEventData {
  id: string;
  userId: string;
  oldScheduledDate: Date;
  newScheduledDate: Date;
}

export class UserTaskRescheduledEvent extends BaseEvent<IUserTaskRescheduledEventData> {
  constructor(metadata: IEventMetadata, data: IUserTaskRescheduledEventData) {
    super(metadata, data);
  }
}
