import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { TaskHandlerRegistry } from '@core/queue/application/registry/task-handler.registry';
import { ITaskQueueContext } from '@core/queue/application/ports/task-handler.port';
import { AssertUserTaskExistsService } from '@contexts/user-tasks/application/services/write/assert-user-task-exists/assert-user-task-exists.service';
import { UserTaskAggregate } from '@contexts/user-tasks/domain/aggregates/user-task.aggregate';
import {
  ITaskTemplateReadRepository,
  TASK_TEMPLATE_READ_REPOSITORY,
} from '@contexts/tasks/domain/repositories/read/task-template-read.repository';
import {
  IUserTaskWriteRepository,
  USER_TASK_WRITE_REPOSITORY,
} from '@contexts/user-tasks/domain/repositories/write/user-task-write.repository';

import { CompleteUserTaskCommand } from './complete-user-task.command';

@CommandHandler(CompleteUserTaskCommand)
export class CompleteUserTaskCommandHandler
  extends BaseCommandHandler<CompleteUserTaskCommand, UserTaskAggregate>
  implements ICommandHandler<CompleteUserTaskCommand, void>
{
  private readonly logger = new Logger(CompleteUserTaskCommandHandler.name);

  constructor(
    @Inject(USER_TASK_WRITE_REPOSITORY)
    private readonly userTaskWriteRepository: IUserTaskWriteRepository,
    @Inject(TASK_TEMPLATE_READ_REPOSITORY)
    private readonly taskTemplateReadRepository: ITaskTemplateReadRepository,
    private readonly assertUserTaskExistsService: AssertUserTaskExistsService,
    private readonly taskHandlerRegistry: TaskHandlerRegistry,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CompleteUserTaskCommand): Promise<void> {
    const task = await this.assertUserTaskExistsService.execute(
      command.id.value,
    );
    const today = new Date();

    // Dispatch handler BEFORE complete+save so a handler failure doesn't orphan completed state
    if (task.taskTemplateId) {
      const template = await this.taskTemplateReadRepository.findById(
        task.taskTemplateId.value,
      );
      if (
        template?.handlerKey &&
        this.taskHandlerRegistry.has(template.handlerKey)
      ) {
        const ctx: ITaskQueueContext = {
          jobId: task.id.value,
          reportProgress: async () => {},
        };
        await this.taskHandlerRegistry.dispatch(template.handlerKey, {}, ctx);
      }
    }

    task.complete(today);

    await this.userTaskWriteRepository.save(task);
    await this.publishEvents(task);

    this.logger.log(`UserTask completed: ${command.id.value}`);
  }
}
