import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';

export interface RescheduleTaskCommandInput {
  id: string;
  scheduledAt: Date;
  userId: string;
}

export class RescheduleTaskCommand {
  public readonly id: TaskIdValueObject;
  public readonly scheduledAt: DateValueObject;
  public readonly userId: UuidValueObject;

  constructor(input: RescheduleTaskCommandInput) {
    this.id = new TaskIdValueObject(input.id);
    this.scheduledAt = new DateValueObject(input.scheduledAt);
    this.userId = new UuidValueObject(input.userId);
  }
}
