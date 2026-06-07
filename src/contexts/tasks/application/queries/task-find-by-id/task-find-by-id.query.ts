import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface TaskFindByIdQueryInput {
  id: string;
  userId: string;
}

export class TaskFindByIdQuery {
  public readonly id: TaskIdValueObject;
  public readonly userId: UuidValueObject;

  constructor(input: TaskFindByIdQueryInput) {
    this.id = new TaskIdValueObject(input.id);
    this.userId = new UuidValueObject(input.userId);
  }
}
