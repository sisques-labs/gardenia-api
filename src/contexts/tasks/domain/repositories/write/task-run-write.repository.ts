import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { TaskRunAggregate } from '@contexts/tasks/domain/aggregates/task-run.aggregate';

export const TASK_RUN_WRITE_REPOSITORY = Symbol('TASK_RUN_WRITE_REPOSITORY');

export interface ITaskRunWriteRepository extends IBaseWriteRepository<TaskRunAggregate> {
  findActiveByTaskId(taskId: string): Promise<TaskRunAggregate | null>;
}
