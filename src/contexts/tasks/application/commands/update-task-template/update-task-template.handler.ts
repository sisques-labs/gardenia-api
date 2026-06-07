import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { TaskTemplateAggregate } from '@contexts/tasks/domain/aggregates/task-template.aggregate';
import { AssertTaskTemplateExistsService } from '@contexts/tasks/application/services/write/assert-task-template-exists/assert-task-template-exists.service';
import {
  ITaskTemplateWriteRepository,
  TASK_TEMPLATE_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-template-write.repository';

import { UpdateTaskTemplateCommand } from './update-task-template.command';

@CommandHandler(UpdateTaskTemplateCommand)
export class UpdateTaskTemplateCommandHandler
  extends BaseCommandHandler<UpdateTaskTemplateCommand, TaskTemplateAggregate>
  implements ICommandHandler<UpdateTaskTemplateCommand, void>
{
  private readonly logger = new Logger(UpdateTaskTemplateCommandHandler.name);

  constructor(
    @Inject(TASK_TEMPLATE_WRITE_REPOSITORY)
    private readonly taskTemplateWriteRepository: ITaskTemplateWriteRepository,
    private readonly assertTaskTemplateExistsService: AssertTaskTemplateExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UpdateTaskTemplateCommand): Promise<void> {
    const template = await this.assertTaskTemplateExistsService.execute(
      command.id.value,
    );

    template.update({
      name: command.name,
      description: command.description,
      handlerKey: command.handlerKey,
      defaultPriority: command.defaultPriority,
      defaultRetryCount: command.defaultRetryCount,
      defaultBackoffStrategy: command.defaultBackoffStrategy,
      defaultTimeoutMs: command.defaultTimeoutMs,
      maxConcurrency: command.maxConcurrency,
      defaultCronExpression: command.defaultCronExpression,
      defaultIsRecurring: command.defaultIsRecurring,
    });

    await this.taskTemplateWriteRepository.save(template);
    await this.publishEvents(template);

    this.logger.log(`Task template updated: ${command.id.value}`);
  }
}
