import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';

export const TASK_READ_REPOSITORY = Symbol('TASK_READ_REPOSITORY');

export interface ITaskReadRepository extends IBaseReadRepository<TaskViewModel> {
  findByIdAndUserId(id: string, userId: string): Promise<TaskViewModel | null>;
  findByIdempotencyKey(
    key: string,
    activeStatuses: string[],
  ): Promise<TaskViewModel | null>;
}
