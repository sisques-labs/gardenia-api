import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { UserTaskViewModel } from '@contexts/user-tasks/domain/view-models/user-task.view-model';

export const USER_TASK_READ_REPOSITORY = Symbol('USER_TASK_READ_REPOSITORY');

export interface IUserTaskReadRepository extends IBaseReadRepository<UserTaskViewModel> {
  findByDate(userId: string, date: Date): Promise<UserTaskViewModel[]>;
}
