import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';

import { RescheduleTaskCommand } from './reschedule-task.command';

@CommandHandler(RescheduleTaskCommand)
export class RescheduleTaskCommandHandler
  extends BaseCommandHandler<RescheduleTaskCommand, TaskAggregate>
  implements ICommandHandler<RescheduleTaskCommand, void>
{
  private readonly logger = new Logger(RescheduleTaskCommandHandler.name);

  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
    private readonly assertTaskExistsService: AssertTaskExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: RescheduleTaskCommand): Promise<void> {
    const task = await this.assertTaskExistsService.execute(command.id.value);
    task.reschedule(command.scheduledAt);
    await this.taskWriteRepository.save(task);
    await this.publishEvents(task);
    this.logger.log(`Task rescheduled: ${command.id.value}`);
  }
}
