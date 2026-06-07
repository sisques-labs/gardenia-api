import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  ITaskTemplateReadRepository,
  TASK_TEMPLATE_READ_REPOSITORY,
} from '@contexts/tasks/domain/repositories/read/task-template-read.repository';
import { TaskTemplateViewModel } from '@contexts/tasks/domain/view-models/task-template.view-model';

import { TaskTemplateFindByCriteriaQuery } from './task-template-find-by-criteria.query';

@QueryHandler(TaskTemplateFindByCriteriaQuery)
export class TaskTemplateFindByCriteriaQueryHandler
  implements IQueryHandler<TaskTemplateFindByCriteriaQuery>
{
  private readonly logger = new Logger(TaskTemplateFindByCriteriaQueryHandler.name);

  constructor(
    @Inject(TASK_TEMPLATE_READ_REPOSITORY)
    private readonly taskTemplateReadRepository: ITaskTemplateReadRepository,
  ) {}

  async execute(
    query: TaskTemplateFindByCriteriaQuery,
  ): Promise<PaginatedResult<TaskTemplateViewModel>> {
    this.logger.log('Finding task templates by criteria');
    return this.taskTemplateReadRepository.findByCriteria(query.criteria);
  }
}
