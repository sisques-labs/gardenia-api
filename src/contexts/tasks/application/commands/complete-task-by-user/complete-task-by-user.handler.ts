import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';

import { CompleteTaskByUserCommand } from './complete-task-by-user.command';

@CommandHandler(CompleteTaskByUserCommand)
export class CompleteTaskByUserCommandHandler
  extends BaseCommandHandler<CompleteTaskByUserCommand, TaskAggregate>
  implements ICommandHandler<CompleteTaskByUserCommand, void>
{
  private readonly logger = new Logger(CompleteTaskByUserCommandHandler.name);

  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
    private readonly assertTaskExistsService: AssertTaskExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CompleteTaskByUserCommand): Promise<void> {
    const task = await this.assertTaskExistsService.execute(command.id.value);
    task.completeByUser(new Date());
    await this.taskWriteRepository.save(task);
    await this.publishEvents(task);
    this.logger.log(`Task completed by user: ${command.id.value}`);
  }
}
