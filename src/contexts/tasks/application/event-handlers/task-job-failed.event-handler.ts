import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TaskJobFailedEvent } from '@core/queue/events/task-job-lifecycle.events';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { TaskRunTypeOrmRepository } from '@contexts/tasks/infrastructure/persistence/typeorm/task-run-typeorm.repository';

@EventsHandler(TaskJobFailedEvent)
export class TaskJobFailedEventHandler
  implements IEventHandler<TaskJobFailedEvent>
{
  private readonly logger = new Logger(TaskJobFailedEventHandler.name);

  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
    private readonly taskRunRepository: TaskRunTypeOrmRepository,
  ) {}

  async handle(event: TaskJobFailedEvent): Promise<void> {
    const now = new Date();

    if (event.isFinal) {
      await this.taskWriteRepository.updateStatus(event.taskId, TaskStatusEnum.FAILED, {
        failedAt: now,
      });
      this.logger.warn(`Task ${event.taskId} permanently failed: ${event.error}`);
    } else {
      this.logger.warn(`Task ${event.taskId} failed (will retry): ${event.error}`);
    }

    const run = await this.taskRunRepository.findActiveByTaskId(event.taskId);
    if (run) {
      await this.taskRunRepository.fail(run.id, event.error, now);
    }
  }
}
