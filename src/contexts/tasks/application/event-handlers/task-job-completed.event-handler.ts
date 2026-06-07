import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TaskJobCompletedEvent } from '@core/queue/events/task-job-lifecycle.events';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { TaskRunTypeOrmRepository } from '@contexts/tasks/infrastructure/persistence/typeorm/task-run-typeorm.repository';

@EventsHandler(TaskJobCompletedEvent)
export class TaskJobCompletedEventHandler
  implements IEventHandler<TaskJobCompletedEvent>
{
  private readonly logger = new Logger(TaskJobCompletedEventHandler.name);

  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
    private readonly taskRunRepository: TaskRunTypeOrmRepository,
  ) {}

  async handle(event: TaskJobCompletedEvent): Promise<void> {
    const now = new Date();

    await this.taskWriteRepository.updateStatus(event.taskId, TaskStatusEnum.COMPLETED, {
      completedAt: now,
    });

    const run = await this.taskRunRepository.findActiveByTaskId(event.taskId);
    if (run) {
      await this.taskRunRepository.complete(run.id, now);
    }

    this.logger.log(`Task ${event.taskId} completed`);
  }
}
