import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskTemplateAggregate } from '@contexts/tasks/domain/aggregates/task-template.aggregate';
import { TaskTemplateBuilder } from '@contexts/tasks/domain/builders/task-template.builder';
import {
  ITaskTemplateWriteRepository,
  TASK_TEMPLATE_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-template-write.repository';

import { CreateTaskTemplateCommand } from './create-task-template.command';

@CommandHandler(CreateTaskTemplateCommand)
export class CreateTaskTemplateCommandHandler
  extends BaseCommandHandler<CreateTaskTemplateCommand, TaskTemplateAggregate>
  implements ICommandHandler<CreateTaskTemplateCommand, string>
{
  private readonly logger = new Logger(CreateTaskTemplateCommandHandler.name);

  constructor(
    @Inject(TASK_TEMPLATE_WRITE_REPOSITORY)
    private readonly taskTemplateWriteRepository: ITaskTemplateWriteRepository,
    private readonly taskTemplateBuilder: TaskTemplateBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateTaskTemplateCommand): Promise<string> {
    const id = UuidValueObject.generate().value;

    const template = this.taskTemplateBuilder
      .withId(id)
      .withName(command.name.value)
      .withDescription(command.description)
      .withHandlerKey(command.handlerKey.value)
      .withDefaultPriority(command.defaultPriority.value)
      .withDefaultRetryCount(command.defaultRetryCount.value)
      .withDefaultBackoffStrategy(command.defaultBackoffStrategy.value)
      .withDefaultTimeoutMs(command.defaultTimeoutMs.value)
      .withMaxConcurrency(command.maxConcurrency.value)
      .withDefaultCronExpression(command.defaultCronExpression)
      .withDefaultIsRecurring(command.defaultIsRecurring)
      .withUserId(command.userId.value)
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();

    template.create();
    await this.taskTemplateWriteRepository.save(template);
    await this.publishEvents(template);

    this.logger.log(`Task template created: ${id}`);
    return id;
  }
}
