import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';

export interface DeleteTaskTemplateCommandInput {
  id: string;
}

export class DeleteTaskTemplateCommand {
  public readonly id: TaskTemplateIdValueObject;

  constructor(input: DeleteTaskTemplateCommandInput) {
    this.id = new TaskTemplateIdValueObject(input.id);
  }
}
