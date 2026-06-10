import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertTaskTemplateExistsService } from '@contexts/tasks/application/services/write/assert-task-template-exists/assert-task-template-exists.service';
import { TaskTemplateAggregate } from '@contexts/tasks/domain/aggregates/task-template.aggregate';
import {
  ITaskTemplateWriteRepository,
  TASK_TEMPLATE_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-template-write.repository';

import { DeleteTaskTemplateCommand } from './delete-task-template.command';

@CommandHandler(DeleteTaskTemplateCommand)
export class DeleteTaskTemplateCommandHandler
  extends BaseCommandHandler<DeleteTaskTemplateCommand, TaskTemplateAggregate>
  implements ICommandHandler<DeleteTaskTemplateCommand, void>
{
  private readonly logger = new Logger(DeleteTaskTemplateCommandHandler.name);

  constructor(
    @Inject(TASK_TEMPLATE_WRITE_REPOSITORY)
    private readonly taskTemplateWriteRepository: ITaskTemplateWriteRepository,
    private readonly assertTaskTemplateExistsService: AssertTaskTemplateExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteTaskTemplateCommand): Promise<void> {
    const template = await this.assertTaskTemplateExistsService.execute(
      command.id.value,
    );

    template.delete();

    await this.taskTemplateWriteRepository.delete(command.id.value);
    await this.publishEvents(template);

    this.logger.log(`Task template deleted: ${command.id.value}`);
  }
}
