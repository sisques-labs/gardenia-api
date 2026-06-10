import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IUserTaskReadRepository,
  USER_TASK_READ_REPOSITORY,
} from '@contexts/user-tasks/domain/repositories/read/user-task-read.repository';
import { UserTaskViewModel } from '@contexts/user-tasks/domain/view-models/user-task.view-model';

import { UserTaskFindByDateQuery } from './user-task-find-by-date.query';

@QueryHandler(UserTaskFindByDateQuery)
export class UserTaskFindByDateQueryHandler implements IQueryHandler<UserTaskFindByDateQuery> {
  private readonly logger = new Logger(UserTaskFindByDateQueryHandler.name);

  constructor(
    @Inject(USER_TASK_READ_REPOSITORY)
    private readonly userTaskReadRepository: IUserTaskReadRepository,
  ) {}

  async execute(query: UserTaskFindByDateQuery): Promise<UserTaskViewModel[]> {
    this.logger.log(
      `Finding UserTasks for userId ${query.userId.value} on date ${query.date.toISOString()}`,
    );
    return this.userTaskReadRepository.findByDate(
      query.userId.value,
      query.date,
    );
  }
}
