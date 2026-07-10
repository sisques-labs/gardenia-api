import '@contexts/plant-species/transport/graphql/enums/plant-species-registered-enums.graphql';

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreatePlantSpeciesCommandHandler } from './application/commands/create-plant-species/create-plant-species.handler';
import { DeletePlantSpeciesCommandHandler } from './application/commands/delete-plant-species/delete-plant-species.handler';
import { FindOrCreatePlantSpeciesByGbifKeyCommandHandler } from './application/commands/find-or-create-plant-species-by-gbif-key/find-or-create-plant-species-by-gbif-key.handler';
import { UpdatePlantSpeciesCommandHandler } from './application/commands/update-plant-species/update-plant-species.handler';
import { GBIF_SPECIES_SEARCH_PORT } from './application/ports/gbif-species-search.port';
import { PLANT_SPECIES_REFERENCE_PORT } from './application/ports/plant-species-reference.port';
import { GbifSpeciesSearchQueryHandler } from './application/queries/gbif-species-search/gbif-species-search.handler';
import { PlantSpeciesFindByCriteriaQueryHandler } from './application/queries/plant-species-find-by-criteria/plant-species-find-by-criteria.handler';
import { PlantSpeciesFindByIdQueryHandler } from './application/queries/plant-species-find-by-id/plant-species-find-by-id.handler';
import { AssertPlantSpeciesViewModelExistsService } from './application/services/read/assert-plant-species-view-model-exists/assert-plant-species-view-model-exists.service';
import { AssertPlantSpeciesExistsService } from './application/services/write/assert-plant-species-exists/assert-plant-species-exists.service';
import { AssertPlantSpeciesGbifKeyAvailableService } from './application/services/write/assert-plant-species-gbif-key-available/assert-plant-species-gbif-key-available.service';
import { AssertPlantSpeciesNotInUseService } from './application/services/write/assert-plant-species-not-in-use/assert-plant-species-not-in-use.service';
import { PlantSpeciesBuilder } from './domain/builders/plant-species.builder';
import { PLANT_SPECIES_READ_REPOSITORY } from './domain/repositories/read/plant-species-read.repository';
import { PLANT_SPECIES_WRITE_REPOSITORY } from './domain/repositories/write/plant-species-write.repository';
import { GbifSpeciesSuggestAdapter } from './infrastructure/adapters/gbif-species-suggest.adapter';
import { PlantSpeciesReferenceAdapter } from './infrastructure/adapters/plant-species-reference.adapter';
import { PlantSpeciesTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/plant-species.entity';
import { PlantSpeciesTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/plant-species-typeorm.mapper';
import { PlantSpeciesTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/plant-species-typeorm-read.repository';
import { PlantSpeciesTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/plant-species-typeorm-write.repository';
import { PlantSpeciesCreateMcpTool } from './transport/mcp/tools/plant-species-create.tool';
import { PlantSpeciesDeleteMcpTool } from './transport/mcp/tools/plant-species-delete.tool';
import { PlantSpeciesFindByCriteriaMcpTool } from './transport/mcp/tools/plant-species-find-by-criteria.tool';
import { PlantSpeciesFindByIdMcpTool } from './transport/mcp/tools/plant-species-find-by-id.tool';
import { PlantSpeciesSearchMcpTool } from './transport/mcp/tools/plant-species-search.tool';
import { PlantSpeciesUpdateMcpTool } from './transport/mcp/tools/plant-species-update.tool';
import { PlantSpeciesGraphQLMapper } from './transport/graphql/mappers/plant-species.mapper';
import { GbifSpeciesSearchQueriesResolver } from './transport/graphql/resolvers/gbif-species-search-queries.resolver';
import { PlantSpeciesMutationsResolver } from './transport/graphql/resolvers/plant-species-mutations.resolver';
import { PlantSpeciesQueriesResolver } from './transport/graphql/resolvers/plant-species-queries.resolver';
import { PlantSpeciesController } from './transport/rest/controllers/plant-species.controller';
import { PlantSpeciesRestMapper } from './transport/rest/mappers/plant-species/plant-species.mapper';

const COMMAND_HANDLERS = [
  CreatePlantSpeciesCommandHandler,
  UpdatePlantSpeciesCommandHandler,
  DeletePlantSpeciesCommandHandler,
  FindOrCreatePlantSpeciesByGbifKeyCommandHandler,
];

const QUERY_HANDLERS = [
  PlantSpeciesFindByIdQueryHandler,
  PlantSpeciesFindByCriteriaQueryHandler,
  GbifSpeciesSearchQueryHandler,
];

const APPLICATION_SERVICES = [
  AssertPlantSpeciesViewModelExistsService,
  AssertPlantSpeciesExistsService,
  AssertPlantSpeciesGbifKeyAvailableService,
  AssertPlantSpeciesNotInUseService,
];

const DOMAIN_BUILDERS = [PlantSpeciesBuilder];

const INFRASTRUCTURE_MAPPERS = [PlantSpeciesTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: PLANT_SPECIES_READ_REPOSITORY,
    useClass: PlantSpeciesTypeOrmReadRepository,
  },
  {
    provide: PLANT_SPECIES_WRITE_REPOSITORY,
    useClass: PlantSpeciesTypeOrmWriteRepository,
  },
];

const INFRASTRUCTURE_ADAPTERS = [
  {
    provide: PLANT_SPECIES_REFERENCE_PORT,
    useClass: PlantSpeciesReferenceAdapter,
  },
  {
    provide: GBIF_SPECIES_SEARCH_PORT,
    useClass: GbifSpeciesSuggestAdapter,
  },
];

const REST_CONTROLLERS = [PlantSpeciesController];
const REST_PROVIDERS = [PlantSpeciesRestMapper];

const GRAPHQL_PROVIDERS = [
  PlantSpeciesQueriesResolver,
  PlantSpeciesMutationsResolver,
  GbifSpeciesSearchQueriesResolver,
  PlantSpeciesGraphQLMapper,
];

const MCP_TOOLS = [
  PlantSpeciesCreateMcpTool,
  PlantSpeciesUpdateMcpTool,
  PlantSpeciesDeleteMcpTool,
  PlantSpeciesSearchMcpTool,
  PlantSpeciesFindByIdMcpTool,
  PlantSpeciesFindByCriteriaMcpTool,
];

@Module({
  imports: [
    CqrsModule,
    HttpModule,
    TypeOrmModule.forFeature([PlantSpeciesTypeOrmEntity]),
  ],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...APPLICATION_SERVICES,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...INFRASTRUCTURE_ADAPTERS,
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
    ...MCP_TOOLS,
  ],
  exports: [],
})
export class PlantSpeciesModule {}
