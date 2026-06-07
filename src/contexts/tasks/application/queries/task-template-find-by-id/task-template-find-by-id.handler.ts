import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertTaskTemplateViewModelExistsService } from '@contexts/tasks/application/services/read/assert-task-template-view-model-exists/assert-task-template-view-model-exists.service';
import { TaskTemplateViewModel } from '@contexts/tasks/domain/view-models/task-template.view-model';

import { TaskTemplateFindByIdQuery } from './task-template-find-by-id.query';

@QueryHandler(TaskTemplateFindByIdQuery)
export class TaskTemplateFindByIdQueryHandler
  implements IQueryHandler<TaskTemplateFindByIdQuery>
{
  private readonly logger = new Logger(TaskTemplateFindByIdQueryHandler.name);

  constructor(
    private readonly assertTaskTemplateViewModelExistsService: AssertTaskTemplateViewModelExistsService,
  ) {}

  async execute(query: TaskTemplateFindByIdQuery): Promise<TaskTemplateViewModel> {
    this.logger.log(`Finding task template by id: ${query.id.value}`);
    return this.assertTaskTemplateViewModelExistsService.execute(query.id.value);
  }
}
