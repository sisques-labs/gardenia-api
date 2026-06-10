import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { UserTaskAggregate } from '@contexts/user-tasks/domain/aggregates/user-task.aggregate';
import { UserTaskBuilder } from '@contexts/user-tasks/domain/builders/user-task.builder';
import { UserTaskRecurrenceLimitExceededException } from '@contexts/user-tasks/domain/exceptions/user-task-recurrence-limit-exceeded.exception';
import {
  IUserTaskWriteRepository,
  USER_TASK_WRITE_REPOSITORY,
} from '@contexts/user-tasks/domain/repositories/write/user-task-write.repository';
import {
  ITaskTemplateReadRepository,
  TASK_TEMPLATE_READ_REPOSITORY,
} from '@contexts/tasks/domain/repositories/read/task-template-read.repository';

import { GenerateUserTasksFromTemplateCommand } from './generate-user-tasks-from-template.command';

export const MAX_USER_TASK_INSTANCES = 365;

@CommandHandler(GenerateUserTasksFromTemplateCommand)
export class GenerateUserTasksFromTemplateCommandHandler
  extends BaseCommandHandler<
    GenerateUserTasksFromTemplateCommand,
    UserTaskAggregate
  >
  implements ICommandHandler<GenerateUserTasksFromTemplateCommand, void>
{
  private readonly logger = new Logger(
    GenerateUserTasksFromTemplateCommandHandler.name,
  );

  constructor(
    @Inject(USER_TASK_WRITE_REPOSITORY)
    private readonly userTaskWriteRepository: IUserTaskWriteRepository,
    @Inject(TASK_TEMPLATE_READ_REPOSITORY)
    private readonly taskTemplateReadRepository: ITaskTemplateReadRepository,
    private readonly userTaskBuilder: UserTaskBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: GenerateUserTasksFromTemplateCommand): Promise<void> {
    const { scheduledDates } = command;

    if (scheduledDates.length === 0) {
      this.logger.log(
        'GenerateUserTasksFromTemplate: no dates provided, skipping',
      );
      return;
    }

    if (scheduledDates.length > MAX_USER_TASK_INSTANCES) {
      throw new UserTaskRecurrenceLimitExceededException(
        scheduledDates.length,
        MAX_USER_TASK_INSTANCES,
      );
    }

    const template = await this.taskTemplateReadRepository.findById(
      command.taskTemplateId.value,
    );

    const title = template?.name ?? 'Task';

    const now = new Date();
    const tasks: UserTaskAggregate[] = scheduledDates.map((date) =>
      this.userTaskBuilder
        .withId(UuidValueObject.generate().value)
        .withTitle(title)
        .withDescription(null)
        .withScheduledDate(date)
        .withUserId(command.userId.value)
        .withTaskTemplateId(command.taskTemplateId.value)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .build(),
    );

    await this.userTaskWriteRepository.saveMany(tasks);

    this.logger.log(
      `Generated ${tasks.length} UserTask(s) from template ${command.taskTemplateId.value}`,
    );
  }
}
