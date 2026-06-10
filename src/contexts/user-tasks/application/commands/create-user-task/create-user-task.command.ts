import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { UserTaskIdValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-id/user-task-id.value-object';

export interface CreateUserTaskCommandInput {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: Date;
  userId: string;
  taskTemplateId: string | null;
}

export class CreateUserTaskCommand {
  public readonly id: UserTaskIdValueObject;
  public readonly title: string;
  public readonly description: string | null;
  public readonly scheduledDate: Date;
  public readonly userId: UuidValueObject;
  public readonly taskTemplateId: string | null;

  constructor(input: CreateUserTaskCommandInput) {
    this.id = new UserTaskIdValueObject(input.id);
    this.title = input.title;
    this.description = input.description;
    this.scheduledDate = input.scheduledDate;
    this.userId = new UuidValueObject(input.userId);
    this.taskTemplateId = input.taskTemplateId;
  }
}
