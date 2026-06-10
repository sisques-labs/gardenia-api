import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { UserTaskAggregate } from '@contexts/user-tasks/domain/aggregates/user-task.aggregate';
import { UserTaskBuilder } from '@contexts/user-tasks/domain/builders/user-task.builder';
import {
  IUserTaskWriteRepository,
  USER_TASK_WRITE_REPOSITORY,
} from '@contexts/user-tasks/domain/repositories/write/user-task-write.repository';

import { CreateUserTaskCommand } from './create-user-task.command';

@CommandHandler(CreateUserTaskCommand)
export class CreateUserTaskCommandHandler
  extends BaseCommandHandler<CreateUserTaskCommand, UserTaskAggregate>
  implements ICommandHandler<CreateUserTaskCommand, void>
{
  private readonly logger = new Logger(CreateUserTaskCommandHandler.name);

  constructor(
    @Inject(USER_TASK_WRITE_REPOSITORY)
    private readonly userTaskWriteRepository: IUserTaskWriteRepository,
    private readonly userTaskBuilder: UserTaskBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateUserTaskCommand): Promise<void> {
    const now = new Date();
    const task = this.userTaskBuilder
      .withId(command.id.value)
      .withTitle(command.title)
      .withDescription(command.description)
      .withScheduledDate(command.scheduledDate)
      .withUserId(command.userId.value)
      .withTaskTemplateId(command.taskTemplateId)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    task.create();

    await this.userTaskWriteRepository.save(task);
    await this.publishEvents(task);

    this.logger.log(`UserTask created: ${command.id.value}`);
  }
}
