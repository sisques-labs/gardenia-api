import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { UserTaskIdValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-id/user-task-id.value-object';

export interface CancelUserTaskCommandInput {
  id: string;
  userId: string;
}

export class CancelUserTaskCommand {
  public readonly id: UserTaskIdValueObject;
  public readonly userId: UuidValueObject;

  constructor(input: CancelUserTaskCommandInput) {
    this.id = new UserTaskIdValueObject(input.id);
    this.userId = new UuidValueObject(input.userId);
  }
}
