import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ITaskTemplatePrimitives } from '@contexts/tasks/domain/primitives/task-template.primitives';

export class TaskTemplateCreatedEvent extends BaseEvent<ITaskTemplatePrimitives> {
  constructor(metadata: IEventMetadata, data: ITaskTemplatePrimitives) {
    super(metadata, data);
  }
}
