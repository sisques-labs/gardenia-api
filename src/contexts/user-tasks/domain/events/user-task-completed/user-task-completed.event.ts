import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IUserTaskEventData } from '@contexts/user-tasks/domain/events/interfaces/user-task-event-data.interface';

export class UserTaskCompletedEvent extends BaseEvent<IUserTaskEventData> {
  constructor(metadata: IEventMetadata, data: IUserTaskEventData) {
    super(metadata, data);
  }
}
