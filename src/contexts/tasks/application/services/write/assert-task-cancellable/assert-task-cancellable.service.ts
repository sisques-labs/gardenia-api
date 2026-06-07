import { Injectable } from '@nestjs/common';

import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { TaskNotCancellableException } from '@contexts/tasks/domain/exceptions/task-not-cancellable.exception';

@Injectable()
export class AssertTaskCancellableService {
  execute(task: TaskAggregate): void {
    if (task.status.value !== TaskStatusEnum.PENDING) {
      throw new TaskNotCancellableException(task.status.value);
    }
  }
}
