import { Inject, Injectable } from '@nestjs/common';

import { UserTaskNotFoundException } from '@contexts/user-tasks/domain/exceptions/user-task-not-found.exception';
import {
  IUserTaskReadRepository,
  USER_TASK_READ_REPOSITORY,
} from '@contexts/user-tasks/domain/repositories/read/user-task-read.repository';
import { UserTaskViewModel } from '@contexts/user-tasks/domain/view-models/user-task.view-model';

@Injectable()
export class AssertUserTaskViewModelExistsService {
  constructor(
    @Inject(USER_TASK_READ_REPOSITORY)
    private readonly userTaskReadRepository: IUserTaskReadRepository,
  ) {}

  async execute(id: string): Promise<UserTaskViewModel> {
    const vm = await this.userTaskReadRepository.findById(id);
    if (!vm) throw new UserTaskNotFoundException(id);
    return vm;
  }
}
