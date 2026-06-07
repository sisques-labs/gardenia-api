import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';

export const TASK_WRITE_REPOSITORY = Symbol('TASK_WRITE_REPOSITORY');

export type ITaskWriteRepository = IBaseWriteRepository<TaskAggregate>;
