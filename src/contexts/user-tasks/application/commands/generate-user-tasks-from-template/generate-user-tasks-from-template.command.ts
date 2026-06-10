import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface GenerateUserTasksFromTemplateCommandInput {
  taskTemplateId: string;
  userId: string;
  /** Pre-computed list of dates on which tasks should be created (caller resolves cron/interval) */
  scheduledDates: Date[];
}

export class GenerateUserTasksFromTemplateCommand {
  public readonly taskTemplateId: UuidValueObject;
  public readonly userId: UuidValueObject;
  public readonly scheduledDates: Date[];

  constructor(input: GenerateUserTasksFromTemplateCommandInput) {
    this.taskTemplateId = new UuidValueObject(input.taskTemplateId);
    this.userId = new UuidValueObject(input.userId);
    this.scheduledDates = input.scheduledDates;
  }
}
