import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskTriggerTypeEnum } from '@contexts/tasks/domain/enums/task-trigger-type.enum';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';

import { CreateTaskCommand } from './create-task.command';

@CommandHandler(CreateTaskCommand)
export class CreateTaskCommandHandler
  extends BaseCommandHandler<CreateTaskCommand, TaskAggregate>
  implements ICommandHandler<CreateTaskCommand, string>
{
  private readonly logger = new Logger(CreateTaskCommandHandler.name);

  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
    private readonly taskBuilder: TaskBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateTaskCommand): Promise<string> {
    const id = UuidValueObject.generate().value;
    const now = new Date();

    const task = this.taskBuilder
      .withId(id)
      .withTemplateId(null)
      .withTriggerType(TaskTriggerTypeEnum.USER)
      .withTitle(command.title.value)
      .withDescription(command.description?.value ?? null)
      .withScheduledAt(command.scheduledAt?.value ?? now)
      .withUserId(command.userId.value)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    task.schedule();
    await this.taskWriteRepository.save(task);
    await this.publishEvents(task);

    this.logger.log(`User task created: ${id}`);
    return id;
  }
}
