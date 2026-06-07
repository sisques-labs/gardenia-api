import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateTaskTemplateCommandHandler } from '@contexts/tasks/application/commands/create-task-template/create-task-template.handler';
import { UpdateTaskTemplateCommandHandler } from '@contexts/tasks/application/commands/update-task-template/update-task-template.handler';
import { ScheduleTaskCommandHandler } from '@contexts/tasks/application/commands/schedule-task/schedule-task.handler';
import { CancelTaskCommandHandler } from '@contexts/tasks/application/commands/cancel-task/cancel-task.handler';
import { TaskTemplateFindByIdQueryHandler } from '@contexts/tasks/application/queries/task-template-find-by-id/task-template-find-by-id.handler';
import { TaskTemplateFindByCriteriaQueryHandler } from '@contexts/tasks/application/queries/task-template-find-by-criteria/task-template-find-by-criteria.handler';
import { TaskFindByIdQueryHandler } from '@contexts/tasks/application/queries/task-find-by-id/task-find-by-id.handler';
import { TaskFindByCriteriaQueryHandler } from '@contexts/tasks/application/queries/task-find-by-criteria/task-find-by-criteria.handler';
import { TaskRunFindByTaskQueryHandler } from '@contexts/tasks/application/queries/task-run-find-by-task/task-run-find-by-task.handler';
import { AssertTaskTemplateExistsService } from '@contexts/tasks/application/services/write/assert-task-template-exists/assert-task-template-exists.service';
import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import { AssertTaskCancellableService } from '@contexts/tasks/application/services/write/assert-task-cancellable/assert-task-cancellable.service';
import { AssertTaskTemplateViewModelExistsService } from '@contexts/tasks/application/services/read/assert-task-template-view-model-exists/assert-task-template-view-model-exists.service';
import { AssertTaskViewModelExistsService } from '@contexts/tasks/application/services/read/assert-task-view-model-exists/assert-task-view-model-exists.service';
import { TaskTemplateBuilder } from '@contexts/tasks/domain/builders/task-template.builder';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TASK_TEMPLATE_READ_REPOSITORY } from '@contexts/tasks/domain/repositories/read/task-template-read.repository';
import { TASK_READ_REPOSITORY } from '@contexts/tasks/domain/repositories/read/task-read.repository';
import { TASK_TEMPLATE_WRITE_REPOSITORY } from '@contexts/tasks/domain/repositories/write/task-template-write.repository';
import { TASK_WRITE_REPOSITORY } from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { TaskTemplateTypeOrmEntity } from '@contexts/tasks/infrastructure/persistence/typeorm/entities/task-template.entity';
import { TaskTypeOrmEntity } from '@contexts/tasks/infrastructure/persistence/typeorm/entities/task.entity';
import { TaskRunTypeOrmEntity } from '@contexts/tasks/infrastructure/persistence/typeorm/entities/task-run.entity';
import { TaskTemplateTypeOrmMapper } from '@contexts/tasks/infrastructure/persistence/typeorm/mappers/task-template-typeorm.mapper';
import { TaskTypeOrmMapper } from '@contexts/tasks/infrastructure/persistence/typeorm/mappers/task-typeorm.mapper';
import { TaskTemplateTypeOrmReadRepository } from '@contexts/tasks/infrastructure/persistence/typeorm/repositories/task-template-typeorm-read.repository';
import { TaskTemplateTypeOrmWriteRepository } from '@contexts/tasks/infrastructure/persistence/typeorm/repositories/task-template-typeorm-write.repository';
import { TaskTypeOrmReadRepository } from '@contexts/tasks/infrastructure/persistence/typeorm/repositories/task-typeorm-read.repository';
import { TaskTypeOrmWriteRepository } from '@contexts/tasks/infrastructure/persistence/typeorm/repositories/task-typeorm-write.repository';
import { TaskRunTypeOrmRepository } from '@contexts/tasks/infrastructure/persistence/typeorm/task-run-typeorm.repository';
import '@contexts/tasks/transport/graphql/enums/tasks-registered-enums.graphql';
import { TaskTemplateGraphQLMapper } from '@contexts/tasks/transport/graphql/mappers/task-template-graphql.mapper';
import { TaskGraphQLMapper } from '@contexts/tasks/transport/graphql/mappers/task-graphql.mapper';
import { TaskTemplateQueriesResolver } from '@contexts/tasks/transport/graphql/resolvers/task-template-queries.resolver';
import { TaskTemplateMutationsResolver } from '@contexts/tasks/transport/graphql/resolvers/task-template-mutations.resolver';
import { TaskQueriesResolver } from '@contexts/tasks/transport/graphql/resolvers/task-queries.resolver';
import { TaskMutationsResolver } from '@contexts/tasks/transport/graphql/resolvers/task-mutations.resolver';
import { TaskTemplatesController } from '@contexts/tasks/transport/rest/controllers/task-templates.controller';
import { TasksController } from '@contexts/tasks/transport/rest/controllers/tasks.controller';
import { TaskTemplateRestMapper } from '@contexts/tasks/transport/rest/mappers/task-template/task-template-rest.mapper';
import { TaskRestMapper } from '@contexts/tasks/transport/rest/mappers/task/task-rest.mapper';

const COMMAND_HANDLERS = [
  CreateTaskTemplateCommandHandler,
  UpdateTaskTemplateCommandHandler,
  ScheduleTaskCommandHandler,
  CancelTaskCommandHandler,
];

const QUERY_HANDLERS = [
  TaskTemplateFindByIdQueryHandler,
  TaskTemplateFindByCriteriaQueryHandler,
  TaskFindByIdQueryHandler,
  TaskFindByCriteriaQueryHandler,
  TaskRunFindByTaskQueryHandler,
];

const APPLICATION_SERVICES = [
  AssertTaskTemplateExistsService,
  AssertTaskExistsService,
  AssertTaskCancellableService,
  AssertTaskTemplateViewModelExistsService,
  AssertTaskViewModelExistsService,
];

const DOMAIN_BUILDERS = [TaskTemplateBuilder, TaskBuilder];

const INFRASTRUCTURE_MAPPERS = [TaskTemplateTypeOrmMapper, TaskTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  { provide: TASK_TEMPLATE_WRITE_REPOSITORY, useClass: TaskTemplateTypeOrmWriteRepository },
  { provide: TASK_TEMPLATE_READ_REPOSITORY, useClass: TaskTemplateTypeOrmReadRepository },
  { provide: TASK_WRITE_REPOSITORY, useClass: TaskTypeOrmWriteRepository },
  { provide: TASK_READ_REPOSITORY, useClass: TaskTypeOrmReadRepository },
];

const REST_CONTROLLERS = [TaskTemplatesController, TasksController];
const REST_PROVIDERS = [TaskTemplateRestMapper, TaskRestMapper];

const GRAPHQL_PROVIDERS = [
  TaskTemplateQueriesResolver,
  TaskTemplateMutationsResolver,
  TaskQueriesResolver,
  TaskMutationsResolver,
  TaskTemplateGraphQLMapper,
  TaskGraphQLMapper,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      TaskTemplateTypeOrmEntity,
      TaskTypeOrmEntity,
      TaskRunTypeOrmEntity,
    ]),
  ],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...APPLICATION_SERVICES,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
    TaskRunTypeOrmRepository,
  ],
})
export class TasksModule {}
