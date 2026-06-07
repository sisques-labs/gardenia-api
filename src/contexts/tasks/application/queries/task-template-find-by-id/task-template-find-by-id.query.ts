import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';

export interface TaskTemplateFindByIdQueryInput {
  id: string;
}

export class TaskTemplateFindByIdQuery {
  public readonly id: TaskTemplateIdValueObject;

  constructor(input: TaskTemplateFindByIdQueryInput) {
    this.id = new TaskTemplateIdValueObject(input.id);
  }
}
