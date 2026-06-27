import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompleteCareScheduleCommandHandler } from '@contexts/care-schedule/application/commands/complete-care-schedule/complete-care-schedule.handler';
import { CreateCareScheduleCommandHandler } from '@contexts/care-schedule/application/commands/create-care-schedule/create-care-schedule.handler';
import { DeleteCareScheduleCommandHandler } from '@contexts/care-schedule/application/commands/delete-care-schedule/delete-care-schedule.handler';
import { UpdateCareScheduleCommandHandler } from '@contexts/care-schedule/application/commands/update-care-schedule/update-care-schedule.handler';
import { CareScheduleFindByCriteriaQueryHandler } from '@contexts/care-schedule/application/queries/care-schedule-find-by-criteria/care-schedule-find-by-criteria.handler';
import { CareScheduleFindByIdQueryHandler } from '@contexts/care-schedule/application/queries/care-schedule-find-by-id/care-schedule-find-by-id.handler';
import { AssertCareScheduleViewModelExistsService } from '@contexts/care-schedule/application/services/read/assert-care-schedule-view-model-exists/assert-care-schedule-view-model-exists.service';
import { AssertCareScheduleExistsService } from '@contexts/care-schedule/application/services/write/assert-care-schedule-exists/assert-care-schedule-exists.service';
import { CareScheduleBuilder } from '@contexts/care-schedule/domain/builders/care-schedule.builder';
import { CARE_SCHEDULE_READ_REPOSITORY } from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import { CARE_SCHEDULE_WRITE_REPOSITORY } from '@contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';
import { CareScheduleTypeOrmEntity } from '@contexts/care-schedule/infrastructure/persistence/typeorm/entities/care-schedule.entity';
import { CareScheduleTypeOrmMapper } from '@contexts/care-schedule/infrastructure/persistence/typeorm/mappers/care-schedule-typeorm.mapper';
import { CareScheduleTypeOrmReadRepository } from '@contexts/care-schedule/infrastructure/persistence/typeorm/repositories/care-schedule-typeorm-read.repository';
import { CareScheduleTypeOrmWriteRepository } from '@contexts/care-schedule/infrastructure/persistence/typeorm/repositories/care-schedule-typeorm-write.repository';
import { CareScheduleCompleteMcpTool } from '@contexts/care-schedule/transport/mcp/tools/care-schedule-complete.tool';
import { CareScheduleCreateMcpTool } from '@contexts/care-schedule/transport/mcp/tools/care-schedule-create.tool';
import { CareScheduleDeleteMcpTool } from '@contexts/care-schedule/transport/mcp/tools/care-schedule-delete.tool';
import { CareScheduleFindByCriteriaMcpTool } from '@contexts/care-schedule/transport/mcp/tools/care-schedule-find-by-criteria.tool';
import { CareScheduleFindByIdMcpTool } from '@contexts/care-schedule/transport/mcp/tools/care-schedule-find-by-id.tool';
import { CareScheduleUpdateMcpTool } from '@contexts/care-schedule/transport/mcp/tools/care-schedule-update.tool';
import '@contexts/care-schedule/transport/graphql/enums/care-schedule-registered-enums.graphql';
import { CareScheduleGraphQLMapper } from '@contexts/care-schedule/transport/graphql/mappers/care-schedule.mapper';
import { CareScheduleMutationsResolver } from '@contexts/care-schedule/transport/graphql/resolvers/care-schedule-mutations.resolver';
import { CareScheduleQueriesResolver } from '@contexts/care-schedule/transport/graphql/resolvers/care-schedule-queries.resolver';
import { CareSchedulesController } from '@contexts/care-schedule/transport/rest/controllers/care-schedules.controller';
import { CareScheduleRestMapper } from '@contexts/care-schedule/transport/rest/mappers/care-schedule/care-schedule.mapper';

const COMMAND_HANDLERS = [
  CreateCareScheduleCommandHandler,
  UpdateCareScheduleCommandHandler,
  CompleteCareScheduleCommandHandler,
  DeleteCareScheduleCommandHandler,
];

const QUERY_HANDLERS = [
  CareScheduleFindByIdQueryHandler,
  CareScheduleFindByCriteriaQueryHandler,
];

const DOMAIN_BUILDERS = [CareScheduleBuilder];

const APPLICATION_SERVICES = [
  AssertCareScheduleExistsService,
  AssertCareScheduleViewModelExistsService,
];

const INFRASTRUCTURE_MAPPERS = [CareScheduleTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: CARE_SCHEDULE_WRITE_REPOSITORY,
    useClass: CareScheduleTypeOrmWriteRepository,
  },
  {
    provide: CARE_SCHEDULE_READ_REPOSITORY,
    useClass: CareScheduleTypeOrmReadRepository,
  },
];

const INFRASTRUCTURE_ENTITIES = [CareScheduleTypeOrmEntity];

const REST_CONTROLLERS = [CareSchedulesController];
const REST_PROVIDERS = [CareScheduleRestMapper];

const GRAPHQL_PROVIDERS = [
  CareScheduleQueriesResolver,
  CareScheduleMutationsResolver,
  CareScheduleGraphQLMapper,
];

const MCP_TOOLS = [
  CareScheduleCreateMcpTool,
  CareScheduleUpdateMcpTool,
  CareScheduleCompleteMcpTool,
  CareScheduleDeleteMcpTool,
  CareScheduleFindByIdMcpTool,
  CareScheduleFindByCriteriaMcpTool,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES)],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...DOMAIN_BUILDERS,
    ...APPLICATION_SERVICES,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
    ...MCP_TOOLS,
  ],
  exports: [],
})
export class CareScheduleModule {}
