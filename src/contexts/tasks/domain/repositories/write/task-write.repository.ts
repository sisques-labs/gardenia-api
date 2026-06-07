import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';

export const TASK_WRITE_REPOSITORY = Symbol('TASK_WRITE_REPOSITORY');

export interface ITaskWriteRepository extends IBaseWriteRepository<TaskAggregate> {
  updateStatus(
    id: string,
    status: string,
    metadata?: {
      startedAt?: Date;
      completedAt?: Date;
      failedAt?: Date;
      cancelledAt?: Date;
    },
  ): Promise<void>;
  updateQueueJobId(id: string, queueJobId: string): Promise<void>;
  incrementRunCount(id: string): Promise<void>;
}
