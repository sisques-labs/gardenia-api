import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { UserTaskIdValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-id/user-task-id.value-object';

export interface RescheduleUserTaskCommandInput {
  id: string;
  userId: string;
  newScheduledDate: Date;
}

export class RescheduleUserTaskCommand {
  public readonly id: UserTaskIdValueObject;
  public readonly userId: UuidValueObject;
  public readonly newScheduledDate: Date;

  constructor(input: RescheduleUserTaskCommandInput) {
    this.id = new UserTaskIdValueObject(input.id);
    this.userId = new UuidValueObject(input.userId);
    this.newScheduledDate = input.newScheduledDate;
  }
}
