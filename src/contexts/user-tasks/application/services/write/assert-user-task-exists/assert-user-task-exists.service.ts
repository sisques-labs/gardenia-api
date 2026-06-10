import { Inject, Injectable } from '@nestjs/common';

import { UserTaskAggregate } from '@contexts/user-tasks/domain/aggregates/user-task.aggregate';
import { UserTaskNotFoundException } from '@contexts/user-tasks/domain/exceptions/user-task-not-found.exception';
import {
  IUserTaskWriteRepository,
  USER_TASK_WRITE_REPOSITORY,
} from '@contexts/user-tasks/domain/repositories/write/user-task-write.repository';

@Injectable()
export class AssertUserTaskExistsService {
  constructor(
    @Inject(USER_TASK_WRITE_REPOSITORY)
    private readonly userTaskWriteRepository: IUserTaskWriteRepository,
  ) {}

  async execute(id: string): Promise<UserTaskAggregate> {
    const task = await this.userTaskWriteRepository.findById(id);
    if (!task) throw new UserTaskNotFoundException(id);
    return task;
  }
}
