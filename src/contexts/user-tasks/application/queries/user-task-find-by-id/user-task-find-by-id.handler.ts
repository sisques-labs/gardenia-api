import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssertUserTaskViewModelExistsService } from '@contexts/user-tasks/application/services/read/assert-user-task-view-model-exists/assert-user-task-view-model-exists.service';
import { UserTaskViewModel } from '@contexts/user-tasks/domain/view-models/user-task.view-model';

import { UserTaskFindByIdQuery } from './user-task-find-by-id.query';

@QueryHandler(UserTaskFindByIdQuery)
export class UserTaskFindByIdQueryHandler implements IQueryHandler<UserTaskFindByIdQuery> {
  private readonly logger = new Logger(UserTaskFindByIdQueryHandler.name);

  constructor(
    private readonly assertUserTaskViewModelExistsService: AssertUserTaskViewModelExistsService,
  ) {}

  async execute(query: UserTaskFindByIdQuery): Promise<UserTaskViewModel> {
    this.logger.log(`Finding UserTask by id: ${query.id.value}`);
    return this.assertUserTaskViewModelExistsService.execute(query.id.value);
  }
}
