import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { TaskTemplateViewModel } from '@contexts/tasks/domain/view-models/task-template.view-model';

export const TASK_TEMPLATE_READ_REPOSITORY = Symbol(
  'TASK_TEMPLATE_READ_REPOSITORY',
);

export type ITaskTemplateReadRepository =
  IBaseReadRepository<TaskTemplateViewModel>;
