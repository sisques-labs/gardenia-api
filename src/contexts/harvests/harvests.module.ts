import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateHarvestCommandHandler } from '@contexts/harvests/application/commands/create-harvest/create-harvest.handler';
import { DeleteHarvestCommandHandler } from '@contexts/harvests/application/commands/delete-harvest/delete-harvest.handler';
import { UpdateHarvestCommandHandler } from '@contexts/harvests/application/commands/update-harvest/update-harvest.handler';
import { HarvestFindByCriteriaQueryHandler } from '@contexts/harvests/application/queries/harvest-find-by-criteria/harvest-find-by-criteria.handler';
import { HarvestFindByIdQueryHandler } from '@contexts/harvests/application/queries/harvest-find-by-id/harvest-find-by-id.handler';
import { AssertHarvestViewModelExistsService } from '@contexts/harvests/application/services/read/assert-harvest-view-model-exists/assert-harvest-view-model-exists.service';
import { AssertHarvestExistsService } from '@contexts/harvests/application/services/write/assert-harvest-exists/assert-harvest-exists.service';
import { HarvestBuilder } from '@contexts/harvests/domain/builders/harvest.builder';
import { HARVEST_READ_REPOSITORY } from '@contexts/harvests/domain/repositories/read/harvest-read.repository';
import { HARVEST_WRITE_REPOSITORY } from '@contexts/harvests/domain/repositories/write/harvest-write.repository';
import { HarvestTypeOrmEntity } from '@contexts/harvests/infrastructure/persistence/typeorm/entities/harvest.entity';
import { HarvestTypeOrmMapper } from '@contexts/harvests/infrastructure/persistence/typeorm/mappers/harvest-typeorm.mapper';
import { HarvestTypeOrmReadRepository } from '@contexts/harvests/infrastructure/persistence/typeorm/repositories/harvest-typeorm-read.repository';
import { HarvestTypeOrmWriteRepository } from '@contexts/harvests/infrastructure/persistence/typeorm/repositories/harvest-typeorm-write.repository';
import { HarvestCreateTool } from '@contexts/harvests/transport/mcp/tools/harvest-create.tool';
import { HarvestDeleteTool } from '@contexts/harvests/transport/mcp/tools/harvest-delete.tool';
import { HarvestFindByCriteriaTool } from '@contexts/harvests/transport/mcp/tools/harvest-find-by-criteria.tool';
import { HarvestFindByIdTool } from '@contexts/harvests/transport/mcp/tools/harvest-find-by-id.tool';
import { HarvestUpdateTool } from '@contexts/harvests/transport/mcp/tools/harvest-update.tool';
import '@contexts/harvests/transport/graphql/enums/harvest-registered-enums.graphql';
import { HarvestGraphQLMapper } from '@contexts/harvests/transport/graphql/mappers/harvest/harvest.mapper';
import { HarvestMutationsResolver } from '@contexts/harvests/transport/graphql/resolvers/harvest/mutations/harvest-mutations.resolver';
import { HarvestQueriesResolver } from '@contexts/harvests/transport/graphql/resolvers/harvest/queries/harvest-queries.resolver';
import { HarvestsController } from '@contexts/harvests/transport/rest/controllers/harvests.controller';
import { HarvestRestMapper } from '@contexts/harvests/transport/rest/mappers/harvest/harvest.mapper';

const COMMAND_HANDLERS = [
  CreateHarvestCommandHandler,
  UpdateHarvestCommandHandler,
  DeleteHarvestCommandHandler,
];

const QUERY_HANDLERS = [
  HarvestFindByIdQueryHandler,
  HarvestFindByCriteriaQueryHandler,
];

const DOMAIN_BUILDERS = [HarvestBuilder];

const APPLICATION_SERVICES = [
  AssertHarvestExistsService,
  AssertHarvestViewModelExistsService,
];

const INFRASTRUCTURE_MAPPERS = [HarvestTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: HARVEST_WRITE_REPOSITORY,
    useClass: HarvestTypeOrmWriteRepository,
  },
  {
    provide: HARVEST_READ_REPOSITORY,
    useClass: HarvestTypeOrmReadRepository,
  },
];

const INFRASTRUCTURE_ENTITIES = [HarvestTypeOrmEntity];

const REST_CONTROLLERS = [HarvestsController];
const REST_PROVIDERS = [HarvestRestMapper];

const GRAPHQL_PROVIDERS = [
  HarvestQueriesResolver,
  HarvestMutationsResolver,
  HarvestGraphQLMapper,
];

const MCP_TOOLS = [
  HarvestCreateTool,
  HarvestUpdateTool,
  HarvestDeleteTool,
  HarvestFindByIdTool,
  HarvestFindByCriteriaTool,
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
export class HarvestsModule {}
