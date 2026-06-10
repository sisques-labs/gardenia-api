import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TaskTemplateDeletedEvent } from '@contexts/tasks/domain/events/task-template-deleted/task-template-deleted.event';
import {
  IUserTaskWriteRepository,
  USER_TASK_WRITE_REPOSITORY,
} from '@contexts/user-tasks/domain/repositories/write/user-task-write.repository';

@EventsHandler(TaskTemplateDeletedEvent)
export class TaskTemplateDeletedEventHandler implements IEventHandler<TaskTemplateDeletedEvent> {
  private readonly logger = new Logger(TaskTemplateDeletedEventHandler.name);

  constructor(
    @Inject(USER_TASK_WRITE_REPOSITORY)
    private readonly userTaskWriteRepository: IUserTaskWriteRepository,
  ) {}

  async handle(event: TaskTemplateDeletedEvent): Promise<void> {
    const { taskTemplateId } = event.data;
    this.logger.log(
      `Cascade-deleting UserTasks for template ${taskTemplateId}`,
    );
    await this.userTaskWriteRepository.deleteByTemplateId(taskTemplateId);
  }
}
