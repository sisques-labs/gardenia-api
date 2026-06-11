import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ITaskTemplateDeletedEventData } from '@contexts/tasks/domain/events/interfaces/task-template-deleted-event-data.interface';

export class TaskTemplateDeletedEvent extends BaseEvent<ITaskTemplateDeletedEventData> {
  constructor(metadata: IEventMetadata, data: ITaskTemplateDeletedEventData) {
    super(metadata, data);
  }
}
