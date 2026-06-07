import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { TaskTemplateAggregate } from '@contexts/tasks/domain/aggregates/task-template.aggregate';

export const TASK_TEMPLATE_WRITE_REPOSITORY = Symbol(
  'TASK_TEMPLATE_WRITE_REPOSITORY',
);

export type ITaskTemplateWriteRepository =
  IBaseWriteRepository<TaskTemplateAggregate>;
