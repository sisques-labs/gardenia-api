import { Inject, Injectable } from '@nestjs/common';

import { TaskNotFoundException } from '@contexts/tasks/domain/exceptions/task-not-found.exception';
import {
  ITaskReadRepository,
  TASK_READ_REPOSITORY,
} from '@contexts/tasks/domain/repositories/read/task-read.repository';
import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';

@Injectable()
export class AssertTaskViewModelExistsService {
  constructor(
    @Inject(TASK_READ_REPOSITORY)
    private readonly taskReadRepository: ITaskReadRepository,
  ) {}

  async execute(id: string): Promise<TaskViewModel> {
    const vm = await this.taskReadRepository.findById(id);
    if (!vm) throw new TaskNotFoundException(id);
    return vm;
  }
}
