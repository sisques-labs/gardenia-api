import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface CancelTaskCommandInput {
  id: string;
  userId: string;
}

export class CancelTaskCommand {
  public readonly id: TaskIdValueObject;
  public readonly userId: UuidValueObject;

  constructor(input: CancelTaskCommandInput) {
    this.id = new TaskIdValueObject(input.id);
    this.userId = new UuidValueObject(input.userId);
  }
}
