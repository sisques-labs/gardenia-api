import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TaskJobProgressEvent } from '@core/queue/events/task-job-lifecycle.events';
import { TaskRunTypeOrmRepository } from '@contexts/tasks/infrastructure/persistence/typeorm/task-run-typeorm.repository';

@EventsHandler(TaskJobProgressEvent)
export class TaskJobProgressEventHandler
  implements IEventHandler<TaskJobProgressEvent>
{
  private readonly logger = new Logger(TaskJobProgressEventHandler.name);

  constructor(private readonly taskRunRepository: TaskRunTypeOrmRepository) {}

  async handle(event: TaskJobProgressEvent): Promise<void> {
    const run = await this.taskRunRepository.findActiveByTaskId(event.taskId);
    if (run) {
      await this.taskRunRepository.updateProgress(run.id, event.progress);
    }
    this.logger.debug(`Task ${event.taskId} progress: ${event.progress}%`);
  }
}
