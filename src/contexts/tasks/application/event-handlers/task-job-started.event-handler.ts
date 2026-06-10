import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskJobStartedEvent } from '@core/queue/domain/events/task-job-started/task-job-started.event';
import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import { TaskRunBuilder } from '@contexts/tasks/domain/builders/task-run.builder';
import { TaskRunStatusEnum } from '@contexts/tasks/domain/enums/task-run-status.enum';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';
import {
  ITaskRunWriteRepository,
  TASK_RUN_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-run-write.repository';

@EventsHandler(TaskJobStartedEvent)
export class TaskJobStartedEventHandler implements IEventHandler<TaskJobStartedEvent> {
  private readonly logger = new Logger(TaskJobStartedEventHandler.name);

  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
    @Inject(TASK_RUN_WRITE_REPOSITORY)
    private readonly taskRunWriteRepository: ITaskRunWriteRepository,
    private readonly assertTaskExistsService: AssertTaskExistsService,
    private readonly taskRunBuilder: TaskRunBuilder,
  ) {}

  async handle(event: TaskJobStartedEvent): Promise<void> {
    const { taskId } = event.data;
    const task = await this.assertTaskExistsService.execute(taskId);

    if (task.status.isTerminal()) {
      this.logger.warn(
        `Task ${taskId} already in terminal state ${task.status.value} — ignoring started event`,
      );
      return;
    }

    const now = new Date();
    task.start();
    await this.taskWriteRepository.save(task);

    const attempt = task.runCount.value;
    const run = this.taskRunBuilder
      .withId(UuidValueObject.generate().value)
      .withTaskId(taskId)
      .withAttempt(attempt)
      .withStatus(TaskRunStatusEnum.ACTIVE)
      .withProgress(0)
      .withError(null)
      .withStartedAt(now)
      .withEndedAt(null)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    run.create();
    await this.taskRunWriteRepository.save(run);

    this.logger.log(`Task ${taskId} started (attempt ${attempt})`);
  }
}
