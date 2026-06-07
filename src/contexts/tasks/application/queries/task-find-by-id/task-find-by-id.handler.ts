import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertTaskViewModelExistsService } from '@contexts/tasks/application/services/read/assert-task-view-model-exists/assert-task-view-model-exists.service';
import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';

import { TaskFindByIdQuery } from './task-find-by-id.query';

@QueryHandler(TaskFindByIdQuery)
export class TaskFindByIdQueryHandler implements IQueryHandler<TaskFindByIdQuery> {
  private readonly logger = new Logger(TaskFindByIdQueryHandler.name);

  constructor(
    private readonly assertTaskViewModelExistsService: AssertTaskViewModelExistsService,
  ) {}

  async execute(query: TaskFindByIdQuery): Promise<TaskViewModel> {
    this.logger.log(`Finding task by id: ${query.id.value}`);
    return this.assertTaskViewModelExistsService.execute(query.id.value);
  }
}
