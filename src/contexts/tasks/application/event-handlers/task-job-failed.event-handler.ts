import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TaskJobFailedEvent } from '@core/queue/domain/events/task-job-failed/task-job-failed.event';
import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';
import {
  ITaskRunWriteRepository,
  TASK_RUN_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-run-write.repository';

@EventsHandler(TaskJobFailedEvent)
export class TaskJobFailedEventHandler implements IEventHandler<TaskJobFailedEvent> {
  private readonly logger = new Logger(TaskJobFailedEventHandler.name);

  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
    @Inject(TASK_RUN_WRITE_REPOSITORY)
    private readonly taskRunWriteRepository: ITaskRunWriteRepository,
    private readonly assertTaskExistsService: AssertTaskExistsService,
  ) {}

  async handle(event: TaskJobFailedEvent): Promise<void> {
    const { taskId, error, isFinal } = event.data;
    const task = await this.assertTaskExistsService.execute(taskId);

    if (isFinal) {
      task.fail(error);
      await this.taskWriteRepository.save(task);
      this.logger.warn(`Task ${taskId} permanently failed: ${error}`);
    } else {
      this.logger.warn(`Task ${taskId} failed (will retry): ${error}`);
    }

    const run = await this.taskRunWriteRepository.findActiveByTaskId(taskId);
    if (run) {
      run.fail(error);
      await this.taskRunWriteRepository.save(run);
    }
  }
}
