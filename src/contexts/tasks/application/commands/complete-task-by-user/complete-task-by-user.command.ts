import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';

export interface CompleteTaskByUserCommandInput {
  id: string;
  userId: string;
}

export class CompleteTaskByUserCommand {
  public readonly id: TaskIdValueObject;
  public readonly userId: string;

  constructor(input: CompleteTaskByUserCommandInput) {
    this.id = new TaskIdValueObject(input.id);
    this.userId = input.userId;
  }
}
