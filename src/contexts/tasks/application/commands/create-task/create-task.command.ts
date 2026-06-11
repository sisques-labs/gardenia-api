import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskDescriptionValueObject } from '@contexts/tasks/domain/value-objects/task-description/task-description.value-object';
import { TaskNameValueObject } from '@contexts/tasks/domain/value-objects/task-name/task-name.value-object';

export interface CreateTaskCommandInput {
  title: string;
  description?: string | null;
  scheduledAt?: Date | null;
  userId: string;
}

export class CreateTaskCommand {
  public readonly title: TaskNameValueObject;
  public readonly description: TaskDescriptionValueObject | null;
  public readonly scheduledAt: DateValueObject | null;
  public readonly userId: UuidValueObject;

  constructor(input: CreateTaskCommandInput) {
    this.title = new TaskNameValueObject(input.title);
    this.description = input.description
      ? new TaskDescriptionValueObject(input.description)
      : null;
    this.scheduledAt = input.scheduledAt
      ? new DateValueObject(input.scheduledAt)
      : null;
    this.userId = new UuidValueObject(input.userId);
  }
}
