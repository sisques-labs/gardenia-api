import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TaskNotFoundException } from '@contexts/tasks/domain/exceptions/task-not-found.exception';
import {
  ITaskReadRepository,
  TASK_READ_REPOSITORY,
} from '@contexts/tasks/domain/repositories/read/task-read.repository';
import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';

import { TaskFindByIdQuery } from './task-find-by-id.query';

@QueryHandler(TaskFindByIdQuery)
export class TaskFindByIdQueryHandler
  implements IQueryHandler<TaskFindByIdQuery>
{
  private readonly logger = new Logger(TaskFindByIdQueryHandler.name);

  constructor(
    @Inject(TASK_READ_REPOSITORY)
    private readonly taskReadRepository: ITaskReadRepository,
  ) {}

  async execute(query: TaskFindByIdQuery): Promise<TaskViewModel> {
    this.logger.log(`Finding task by id: ${query.id.value}`);
    const vm = await this.taskReadRepository.findByIdAndUserId(
      query.id.value,
      query.userId.value,
    );
    if (!vm) throw new TaskNotFoundException(query.id.value);
    return vm;
  }
}
