import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Criteria, FilterOperator, PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  ITaskReadRepository,
  TASK_READ_REPOSITORY,
} from '@contexts/tasks/domain/repositories/read/task-read.repository';
import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';

import { TaskFindByCriteriaQuery } from './task-find-by-criteria.query';

@QueryHandler(TaskFindByCriteriaQuery)
export class TaskFindByCriteriaQueryHandler
  implements IQueryHandler<TaskFindByCriteriaQuery>
{
  private readonly logger = new Logger(TaskFindByCriteriaQueryHandler.name);

  constructor(
    @Inject(TASK_READ_REPOSITORY)
    private readonly taskReadRepository: ITaskReadRepository,
  ) {}

  async execute(
    query: TaskFindByCriteriaQuery,
  ): Promise<PaginatedResult<TaskViewModel>> {
    this.logger.log(`Finding tasks by criteria for user: ${query.userId.value}`);
    const criteriaWithUser = new Criteria(
      [
        ...(query.criteria.filters ?? []),
        { field: 'userId', operator: FilterOperator.EQUALS, value: query.userId.value },
      ],
      query.criteria.sorts,
      query.criteria.pagination,
    );
    return this.taskReadRepository.findByCriteria(criteriaWithUser);
  }
}
