import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateCareLogEntryCommandHandler } from './application/commands/create-care-log-entry/create-care-log-entry.handler';
import { DeleteCareLogEntryCommandHandler } from './application/commands/delete-care-log-entry/delete-care-log-entry.handler';
import { UpdateCareLogEntryCommandHandler } from './application/commands/update-care-log-entry/update-care-log-entry.handler';
import { CareLogFindByCriteriaQueryHandler } from './application/queries/care-log-find-by-criteria/care-log-find-by-criteria.handler';
import { CareLogFindLastByTypeQueryHandler } from './application/queries/care-log-find-last-by-type/care-log-find-last-by-type.handler';
import { AssertCareLogEntryViewModelExistsService } from './application/services/read/assert-care-log-entry-view-model-exists/assert-care-log-entry-view-model-exists.service';
import { AssertCareLogEntryExistsService } from './application/services/write/assert-care-log-entry-exists/assert-care-log-entry-exists.service';
import { CareLogEntryBuilder } from './domain/builders/care-log-entry.builder';
import { CARE_LOG_ENTRY_READ_REPOSITORY } from './domain/repositories/read/care-log-entry-read.repository';
import { CARE_LOG_ENTRY_WRITE_REPOSITORY } from './domain/repositories/write/care-log-entry-write.repository';
import { CareLogEntryTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/care-log-entry.entity';
import { CareLogEntryTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/care-log-entry-typeorm.mapper';
import { CareLogEntryTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/care-log-entry-typeorm-read.repository';
import { CareLogEntryTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/care-log-entry-typeorm-write.repository';
import './transport/graphql/enums/care-log-registered-enums.graphql';
import { CareLogGraphQLMapper } from './transport/graphql/mappers/care-log/care-log.mapper';
import { CareLogMutationsResolver } from './transport/graphql/resolvers/care-log-mutations.resolver';
import { CareLogQueriesResolver } from './transport/graphql/resolvers/care-log-queries.resolver';
import { CareLogCreateTool } from './transport/mcp/tools/care-log-create.tool';
import { CareLogDeleteTool } from './transport/mcp/tools/care-log-delete.tool';
import { CareLogFindByCriteriaTool } from './transport/mcp/tools/care-log-find-by-criteria.tool';
import { CareLogFindLastByTypeTool } from './transport/mcp/tools/care-log-find-last-by-type.tool';
import { CareLogUpdateTool } from './transport/mcp/tools/care-log-update.tool';
import { CareLogController } from './transport/rest/controllers/care-log.controller';
import { CareLogRestMapper } from './transport/rest/mappers/care-log/care-log.mapper';

const COMMAND_HANDLERS = [
  CreateCareLogEntryCommandHandler,
  UpdateCareLogEntryCommandHandler,
  DeleteCareLogEntryCommandHandler,
];

const QUERY_HANDLERS = [
  CareLogFindByCriteriaQueryHandler,
  CareLogFindLastByTypeQueryHandler,
];

const APPLICATION_SERVICES = [
  AssertCareLogEntryExistsService,
  AssertCareLogEntryViewModelExistsService,
];

const DOMAIN_BUILDERS = [CareLogEntryBuilder];

const INFRASTRUCTURE_MAPPERS = [CareLogEntryTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: CARE_LOG_ENTRY_WRITE_REPOSITORY,
    useClass: CareLogEntryTypeOrmWriteRepository,
  },
  {
    provide: CARE_LOG_ENTRY_READ_REPOSITORY,
    useClass: CareLogEntryTypeOrmReadRepository,
  },
];

const REST_CONTROLLERS = [CareLogController];
const REST_PROVIDERS = [CareLogRestMapper];
const GRAPHQL_PROVIDERS = [
  CareLogMutationsResolver,
  CareLogQueriesResolver,
  CareLogGraphQLMapper,
];

const MCP_TOOLS = [
  CareLogCreateTool,
  CareLogUpdateTool,
  CareLogDeleteTool,
  CareLogFindByCriteriaTool,
  CareLogFindLastByTypeTool,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([CareLogEntryTypeOrmEntity])],
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
    ...MCP_TOOLS,
  ],
  exports: [],
})
export class CareLogModule {}
