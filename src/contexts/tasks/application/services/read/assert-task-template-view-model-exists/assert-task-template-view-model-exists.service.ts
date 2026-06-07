import { Inject, Injectable } from '@nestjs/common';

import { TaskTemplateNotFoundException } from '@contexts/tasks/domain/exceptions/task-template-not-found.exception';
import {
  ITaskTemplateReadRepository,
  TASK_TEMPLATE_READ_REPOSITORY,
} from '@contexts/tasks/domain/repositories/read/task-template-read.repository';
import { TaskTemplateViewModel } from '@contexts/tasks/domain/view-models/task-template.view-model';

@Injectable()
export class AssertTaskTemplateViewModelExistsService {
  constructor(
    @Inject(TASK_TEMPLATE_READ_REPOSITORY)
    private readonly taskTemplateReadRepository: ITaskTemplateReadRepository,
  ) {}

  async execute(id: string): Promise<TaskTemplateViewModel> {
    const vm = await this.taskTemplateReadRepository.findById(id);
    if (!vm) throw new TaskTemplateNotFoundException(id);
    return vm;
  }
}
