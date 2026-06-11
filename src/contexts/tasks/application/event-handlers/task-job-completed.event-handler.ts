import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TaskJobCompletedEvent } from '@core/queue/domain/events/task-job-completed/task-job-completed.event';
import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';
import {
  ITaskRunWriteRepository,
  TASK_RUN_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-run-write.repository';

@EventsHandler(TaskJobCompletedEvent)
export class TaskJobCompletedEventHandler implements IEventHandler<TaskJobCompletedEvent> {
  private readonly logger = new Logger(TaskJobCompletedEventHandler.name);

  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
    @Inject(TASK_RUN_WRITE_REPOSITORY)
    private readonly taskRunWriteRepository: ITaskRunWriteRepository,
    private readonly assertTaskExistsService: AssertTaskExistsService,
  ) {}

  async handle(event: TaskJobCompletedEvent): Promise<void> {
    const { taskId } = event.data;
    const task = await this.assertTaskExistsService.execute(taskId);

    const run = await this.taskRunWriteRepository.findActiveByTaskId(taskId);
    if (run) {
      run.complete();
      await this.taskRunWriteRepository.save(run);
    }

    task.complete();
    await this.taskWriteRepository.save(task);

    this.logger.log(`Task ${taskId} completed`);
  }
}
