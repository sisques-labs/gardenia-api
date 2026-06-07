import { Inject, Injectable } from '@nestjs/common';

import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import { TaskNotFoundException } from '@contexts/tasks/domain/exceptions/task-not-found.exception';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';

@Injectable()
export class AssertTaskExistsService {
  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
  ) {}

  async execute(id: string): Promise<TaskAggregate> {
    const task = await this.taskWriteRepository.findById(id);
    if (!task) throw new TaskNotFoundException(id);
    return task;
  }
}
