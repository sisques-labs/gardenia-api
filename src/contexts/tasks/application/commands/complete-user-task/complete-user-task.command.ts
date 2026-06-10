import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';

export interface CompleteUserTaskCommandInput {
  id: string;
  userId: string;
}

export class CompleteUserTaskCommand {
  public readonly id: TaskIdValueObject;
  public readonly userId: string;

  constructor(input: CompleteUserTaskCommandInput) {
    this.id = new TaskIdValueObject(input.id);
    this.userId = input.userId;
  }
}
