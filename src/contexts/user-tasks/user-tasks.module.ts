import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TasksModule } from '@contexts/tasks/tasks.module';
import { TaskTemplateDeletedEventHandler } from '@contexts/user-tasks/application/event-handlers/task-template-deleted.event-handler';
import { CancelUserTaskCommandHandler } from '@contexts/user-tasks/application/commands/cancel-user-task/cancel-user-task.handler';
import { CompleteUserTaskCommandHandler } from '@contexts/user-tasks/application/commands/complete-user-task/complete-user-task.handler';
import { CreateUserTaskCommandHandler } from '@contexts/user-tasks/application/commands/create-user-task/create-user-task.handler';
import { GenerateUserTasksFromTemplateCommandHandler } from '@contexts/user-tasks/application/commands/generate-user-tasks-from-template/generate-user-tasks-from-template.handler';
import { RescheduleUserTaskCommandHandler } from '@contexts/user-tasks/application/commands/reschedule-user-task/reschedule-user-task.handler';
import { UserTaskFindByDateQueryHandler } from '@contexts/user-tasks/application/queries/user-task-find-by-date/user-task-find-by-date.handler';
import { UserTaskFindByIdQueryHandler } from '@contexts/user-tasks/application/queries/user-task-find-by-id/user-task-find-by-id.handler';
import { AssertUserTaskViewModelExistsService } from '@contexts/user-tasks/application/services/read/assert-user-task-view-model-exists/assert-user-task-view-model-exists.service';
import { AssertUserTaskCompletableService } from '@contexts/user-tasks/application/services/write/assert-user-task-completable/assert-user-task-completable.service';
import { AssertUserTaskExistsService } from '@contexts/user-tasks/application/services/write/assert-user-task-exists/assert-user-task-exists.service';
import { UserTaskBuilder } from '@contexts/user-tasks/domain/builders/user-task.builder';
import { USER_TASK_READ_REPOSITORY } from '@contexts/user-tasks/domain/repositories/read/user-task-read.repository';
import { USER_TASK_WRITE_REPOSITORY } from '@contexts/user-tasks/domain/repositories/write/user-task-write.repository';
import { UserTaskTypeOrmEntity } from '@contexts/user-tasks/infrastructure/persistence/typeorm/entities/user-task.entity';
import { UserTaskTypeOrmMapper } from '@contexts/user-tasks/infrastructure/persistence/typeorm/mappers/user-task-typeorm.mapper';
import { UserTaskTypeOrmReadRepository } from '@contexts/user-tasks/infrastructure/persistence/typeorm/repositories/user-task-typeorm-read.repository';
import { UserTaskTypeOrmWriteRepository } from '@contexts/user-tasks/infrastructure/persistence/typeorm/repositories/user-task-typeorm-write.repository';
import '@contexts/user-tasks/transport/graphql/enums/user-tasks-registered-enums.graphql';
import { UserTaskGraphQLMapper } from '@contexts/user-tasks/transport/graphql/mappers/user-task-graphql.mapper';
import { UserTaskMutationsResolver } from '@contexts/user-tasks/transport/graphql/resolvers/user-task-mutations.resolver';
import { UserTaskQueriesResolver } from '@contexts/user-tasks/transport/graphql/resolvers/user-task-queries.resolver';
import { UserTasksController } from '@contexts/user-tasks/transport/rest/controllers/user-tasks.controller';
import { UserTaskRestMapper } from '@contexts/user-tasks/transport/rest/mappers/user-task-rest.mapper';

const COMMAND_HANDLERS = [
  CreateUserTaskCommandHandler,
  CompleteUserTaskCommandHandler,
  CancelUserTaskCommandHandler,
  RescheduleUserTaskCommandHandler,
  GenerateUserTasksFromTemplateCommandHandler,
];

const QUERY_HANDLERS = [
  UserTaskFindByIdQueryHandler,
  UserTaskFindByDateQueryHandler,
];

const EVENT_HANDLERS = [TaskTemplateDeletedEventHandler];

const APPLICATION_SERVICES = [
  AssertUserTaskExistsService,
  AssertUserTaskCompletableService,
  AssertUserTaskViewModelExistsService,
];

const DOMAIN_BUILDERS = [UserTaskBuilder];

const INFRASTRUCTURE_MAPPERS = [UserTaskTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: USER_TASK_WRITE_REPOSITORY,
    useClass: UserTaskTypeOrmWriteRepository,
  },
  {
    provide: USER_TASK_READ_REPOSITORY,
    useClass: UserTaskTypeOrmReadRepository,
  },
];

const REST_PROVIDERS = [UserTaskRestMapper];
const REST_CONTROLLERS = [UserTasksController];

const GRAPHQL_PROVIDERS = [
  UserTaskMutationsResolver,
  UserTaskQueriesResolver,
  UserTaskGraphQLMapper,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserTaskTypeOrmEntity]),
    TasksModule,
  ],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...EVENT_HANDLERS,
    ...APPLICATION_SERVICES,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
  ],
})
export class UserTasksModule {}
