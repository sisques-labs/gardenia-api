import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertUserTaskExistsService } from '@contexts/user-tasks/application/services/write/assert-user-task-exists/assert-user-task-exists.service';
import { UserTaskAggregate } from '@contexts/user-tasks/domain/aggregates/user-task.aggregate';
import {
  IUserTaskWriteRepository,
  USER_TASK_WRITE_REPOSITORY,
} from '@contexts/user-tasks/domain/repositories/write/user-task-write.repository';

import { RescheduleUserTaskCommand } from './reschedule-user-task.command';

@CommandHandler(RescheduleUserTaskCommand)
export class RescheduleUserTaskCommandHandler
  extends BaseCommandHandler<RescheduleUserTaskCommand, UserTaskAggregate>
  implements ICommandHandler<RescheduleUserTaskCommand, void>
{
  private readonly logger = new Logger(RescheduleUserTaskCommandHandler.name);

  constructor(
    @Inject(USER_TASK_WRITE_REPOSITORY)
    private readonly userTaskWriteRepository: IUserTaskWriteRepository,
    private readonly assertUserTaskExistsService: AssertUserTaskExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: RescheduleUserTaskCommand): Promise<void> {
    const task = await this.assertUserTaskExistsService.execute(
      command.id.value,
    );

    task.reschedule(command.newScheduledDate);

    await this.userTaskWriteRepository.save(task);
    await this.publishEvents(task);

    this.logger.log(`UserTask rescheduled: ${command.id.value}`);
  }
}
