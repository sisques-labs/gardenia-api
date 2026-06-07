import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ITaskRunPrimitives } from '@contexts/tasks/domain/primitives/task-run.primitives';

export class TaskRunFailedEvent extends BaseEvent<ITaskRunPrimitives> {
  constructor(metadata: IEventMetadata, data: ITaskRunPrimitives) {
    super(metadata, data);
  }
}
