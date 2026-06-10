import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';

export interface RescheduleTaskCommandInput {
  id: string;
  scheduledAt: Date;
  userId: string;
}

export class RescheduleTaskCommand {
  public readonly id: TaskTemplateIdValueObject;
  public readonly scheduledAt: Date;
  public readonly userId: string;

  constructor(input: RescheduleTaskCommandInput) {
    this.id = new TaskTemplateIdValueObject(input.id);
    this.scheduledAt = input.scheduledAt;
    this.userId = input.userId;
  }
}
