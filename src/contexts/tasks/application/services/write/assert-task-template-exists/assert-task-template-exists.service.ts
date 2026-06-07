import { Inject, Injectable } from '@nestjs/common';

import { TaskTemplateAggregate } from '@contexts/tasks/domain/aggregates/task-template.aggregate';
import { TaskTemplateNotFoundException } from '@contexts/tasks/domain/exceptions/task-template-not-found.exception';
import {
  ITaskTemplateWriteRepository,
  TASK_TEMPLATE_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-template-write.repository';

@Injectable()
export class AssertTaskTemplateExistsService {
  constructor(
    @Inject(TASK_TEMPLATE_WRITE_REPOSITORY)
    private readonly taskTemplateWriteRepository: ITaskTemplateWriteRepository,
  ) {}

  async execute(id: string): Promise<TaskTemplateAggregate> {
    const template = await this.taskTemplateWriteRepository.findById(id);
    if (!template) throw new TaskTemplateNotFoundException(id);
    return template;
  }
}
