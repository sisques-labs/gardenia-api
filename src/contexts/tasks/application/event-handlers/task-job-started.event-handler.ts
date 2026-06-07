import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TaskJobStartedEvent } from '@core/queue/events/task-job-lifecycle.events';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { TaskRunTypeOrmRepository } from '@contexts/tasks/infrastructure/persistence/typeorm/task-run-typeorm.repository';

@EventsHandler(TaskJobStartedEvent)
export class TaskJobStartedEventHandler
  implements IEventHandler<TaskJobStartedEvent>
{
  private readonly logger = new Logger(TaskJobStartedEventHandler.name);

  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
    private readonly taskRunRepository: TaskRunTypeOrmRepository,
  ) {}

  async handle(event: TaskJobStartedEvent): Promise<void> {
    const now = new Date();

    await this.taskWriteRepository.updateStatus(event.taskId, TaskStatusEnum.ACTIVE, {
      startedAt: now,
    });
    await this.taskWriteRepository.incrementRunCount(event.taskId);

    const attempt = (await this.taskRunRepository.countByTaskId(event.taskId)) + 1;
    await this.taskRunRepository.create({
      taskId: event.taskId,
      attempt,
      status: 'active',
      progress: 0,
      startedAt: now,
      endedAt: null,
      error: null,
    });

    this.logger.log(`Task ${event.taskId} started (attempt ${attempt})`);
  }
}
