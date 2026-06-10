import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { UserTaskAggregate } from '@contexts/user-tasks/domain/aggregates/user-task.aggregate';

export const USER_TASK_WRITE_REPOSITORY = Symbol('USER_TASK_WRITE_REPOSITORY');

export interface IUserTaskWriteRepository extends IBaseWriteRepository<UserTaskAggregate> {
  saveMany(tasks: UserTaskAggregate[]): Promise<void>;
  deleteByTemplateId(templateId: string): Promise<void>;
}
