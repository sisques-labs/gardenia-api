import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';

export interface TaskFindByIdQueryInput {
  id: string;
}

export class TaskFindByIdQuery {
  public readonly id: TaskIdValueObject;

  constructor(input: TaskFindByIdQueryInput) {
    this.id = new TaskIdValueObject(input.id);
  }
}
