import { Injectable } from '@nestjs/common';

import { UserTaskAggregate } from '@contexts/user-tasks/domain/aggregates/user-task.aggregate';
import { UserTaskStatusEnum } from '@contexts/user-tasks/domain/enums/user-task-status.enum';
import { UserTaskNotCompletableException } from '@contexts/user-tasks/domain/exceptions/user-task-not-completable.exception';

@Injectable()
export class AssertUserTaskCompletableService {
  execute(task: UserTaskAggregate, today: Date): void {
    if (task.status.value !== UserTaskStatusEnum.PENDING) {
      throw new UserTaskNotCompletableException(task.scheduledDate.value);
    }

    const scheduledDay = this.toDateOnly(task.scheduledDate.value);
    const todayDay = this.toDateOnly(today);

    if (scheduledDay > todayDay) {
      throw new UserTaskNotCompletableException(task.scheduledDate.value);
    }
  }

  private toDateOnly(date: Date): number {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
