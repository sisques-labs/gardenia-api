import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  ITaskRunReadRepository,
  TASK_RUN_READ_REPOSITORY,
} from '@contexts/tasks/domain/repositories/read/task-run-read.repository';
import { TaskRunViewModel } from '@contexts/tasks/domain/view-models/task-run.view-model';

import { TaskRunFindByTaskQuery } from './task-run-find-by-task.query';

@QueryHandler(TaskRunFindByTaskQuery)
export class TaskRunFindByTaskQueryHandler
  implements IQueryHandler<TaskRunFindByTaskQuery>
{
  private readonly logger = new Logger(TaskRunFindByTaskQueryHandler.name);

  constructor(
    @Inject(TASK_RUN_READ_REPOSITORY)
    private readonly taskRunReadRepository: ITaskRunReadRepository,
  ) {}

  async execute(query: TaskRunFindByTaskQuery): Promise<TaskRunViewModel[]> {
    this.logger.log(`Finding task runs for task: ${query.taskId.value}`);
    return this.taskRunReadRepository.findByTaskId(query.taskId.value);
  }
}
