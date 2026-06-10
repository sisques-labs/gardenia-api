import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export interface TaskTemplateDeletedEventData {
  taskTemplateId: string;
}

export class TaskTemplateDeletedEvent extends BaseEvent<TaskTemplateDeletedEventData> {
  constructor(metadata: IEventMetadata, data: TaskTemplateDeletedEventData) {
    super(metadata, data);
  }
}
