import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TaskJobProgressEvent } from '@core/queue/domain/events/task-job-progress/task-job-progress.event';
import {
  ITaskRunWriteRepository,
  TASK_RUN_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-run-write.repository';

@EventsHandler(TaskJobProgressEvent)
export class TaskJobProgressEventHandler implements IEventHandler<TaskJobProgressEvent> {
  private readonly logger = new Logger(TaskJobProgressEventHandler.name);

  constructor(
    @Inject(TASK_RUN_WRITE_REPOSITORY)
    private readonly taskRunWriteRepository: ITaskRunWriteRepository,
  ) {}

  async handle(event: TaskJobProgressEvent): Promise<void> {
    const { taskId, progress } = event.data;
    const run = await this.taskRunWriteRepository.findActiveByTaskId(taskId);
    if (run) {
      run.updateProgress(progress);
      await this.taskRunWriteRepository.save(run);
    }
    this.logger.debug(`Task ${taskId} progress: ${progress}%`);
  }
}
