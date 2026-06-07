import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';

export interface TaskRunFindByTaskQueryInput {
  taskId: string;
}

export class TaskRunFindByTaskQuery {
  public readonly taskId: TaskIdValueObject;

  constructor(input: TaskRunFindByTaskQueryInput) {
    this.taskId = new TaskIdValueObject(input.taskId);
  }
}
