import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertTaskCancellableService } from '@contexts/tasks/application/services/write/assert-task-cancellable/assert-task-cancellable.service';
import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';
import {
  ITaskQueueProvider,
  TASK_QUEUE_PROVIDER,
} from '@core/task-queue/ports/task-queue-provider.port';

import { CancelTaskCommand } from './cancel-task.command';

@CommandHandler(CancelTaskCommand)
export class CancelTaskCommandHandler
  extends BaseCommandHandler<CancelTaskCommand, TaskAggregate>
  implements ICommandHandler<CancelTaskCommand, void>
{
  private readonly logger = new Logger(CancelTaskCommandHandler.name);

  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
    @Inject(TASK_QUEUE_PROVIDER)
    private readonly taskQueueProvider: ITaskQueueProvider,
    private readonly assertTaskExistsService: AssertTaskExistsService,
    private readonly assertTaskCancellableService: AssertTaskCancellableService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CancelTaskCommand): Promise<void> {
    const task = await this.assertTaskExistsService.execute(command.id.value);
    this.assertTaskCancellableService.execute(task);

    if (task.queueJobId) {
      await this.taskQueueProvider.cancel(task.queueJobId);
    }

    task.cancel();
    await this.taskWriteRepository.save(task);
    await this.publishEvents(task);

    this.logger.log(`Task cancelled: ${command.id.value}`);
  }
}
