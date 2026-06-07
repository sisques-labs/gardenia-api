import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TaskRunTypeOrmRepository } from '@contexts/tasks/infrastructure/persistence/typeorm/task-run-typeorm.repository';
import { TaskRunTypeOrmEntity } from '@contexts/tasks/infrastructure/persistence/typeorm/entities/task-run.entity';

import { TaskRunFindByTaskQuery } from './task-run-find-by-task.query';

@QueryHandler(TaskRunFindByTaskQuery)
export class TaskRunFindByTaskQueryHandler
  implements IQueryHandler<TaskRunFindByTaskQuery>
{
  private readonly logger = new Logger(TaskRunFindByTaskQueryHandler.name);

  constructor(
    private readonly taskRunRepository: TaskRunTypeOrmRepository,
  ) {}

  async execute(query: TaskRunFindByTaskQuery): Promise<TaskRunTypeOrmEntity[]> {
    this.logger.log(`Finding task runs for task: ${query.taskId.value}`);
    return this.taskRunRepository.findByTaskId(query.taskId.value);
  }
}
