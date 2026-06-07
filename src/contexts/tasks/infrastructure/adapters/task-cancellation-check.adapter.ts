import { Inject, Injectable } from '@nestjs/common';

import { ITaskCancellationCheckPort } from '@core/queue/ports/task-cancellation-check.port';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { ITaskReadRepository, TASK_READ_REPOSITORY } from '@contexts/tasks/domain/repositories/read/task-read.repository';

@Injectable()
export class TaskCancellationCheckAdapter implements ITaskCancellationCheckPort {
  constructor(
    @Inject(TASK_READ_REPOSITORY)
    private readonly taskReadRepository: ITaskReadRepository,
  ) {}

  async isCancelled(taskId: string): Promise<boolean> {
    const task = await this.taskReadRepository.findById(taskId);
    return task?.status === TaskStatusEnum.CANCELLED;
  }
}
