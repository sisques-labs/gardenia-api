import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreatePlantFromIdentificationCommandHandler } from '@contexts/plant-identification/application/commands/create-plant-from-identification/create-plant-from-identification.handler';
import { IdentifyPlantCommandHandler } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant.handler';
import { FILES_PORT } from '@contexts/plant-identification/application/ports/files.port';
import { PLANTS_PORT } from '@contexts/plant-identification/application/ports/plants.port';
import { PLANTNET_IDENTIFICATION_PORT } from '@contexts/plant-identification/application/ports/plantnet-identification.port';
import { PLANT_SPECIES_PORT } from '@contexts/plant-identification/application/ports/plant-species.port';
import { PlantIdentificationFindByCriteriaQueryHandler } from '@contexts/plant-identification/application/queries/plant-identification-find-by-criteria/plant-identification-find-by-criteria.handler';
import { PlantIdentificationFindByIdQueryHandler } from '@contexts/plant-identification/application/queries/plant-identification-find-by-id/plant-identification-find-by-id.handler';
import { AssertPlantIdentificationViewModelExistsService } from '@contexts/plant-identification/application/services/read/assert-plant-identification-view-model-exists/assert-plant-identification-view-model-exists.service';
import { AssertPlantIdentificationExistsService } from '@contexts/plant-identification/application/services/write/assert-plant-identification-exists/assert-plant-identification-exists.service';
import { AssertPlantIdentificationNotConvertedService } from '@contexts/plant-identification/application/services/write/assert-plant-identification-not-converted/assert-plant-identification-not-converted.service';
import { AssertPlantIdentificationOwnershipService } from '@contexts/plant-identification/application/services/write/assert-plant-identification-ownership/assert-plant-identification-ownership.service';
import { AssertPlantIdentificationResolvedService } from '@contexts/plant-identification/application/services/write/assert-plant-identification-resolved/assert-plant-identification-resolved.service';
import { IdentifyPlantPhotosService } from '@contexts/plant-identification/application/services/write/identify-plant-photos/identify-plant-photos.service';
import { ResolvePlantSpeciesMatchService } from '@contexts/plant-identification/application/services/write/resolve-plant-species-match/resolve-plant-species-match.service';
import { UploadIdentificationPhotosService } from '@contexts/plant-identification/application/services/write/upload-identification-photos/upload-identification-photos.service';
import { PlantIdentificationBuilder } from '@contexts/plant-identification/domain/builders/plant-identification.builder';
import { PLANT_IDENTIFICATION_READ_REPOSITORY } from '@contexts/plant-identification/domain/repositories/read/plant-identification-read.repository';
import { PLANT_IDENTIFICATION_WRITE_REPOSITORY } from '@contexts/plant-identification/domain/repositories/write/plant-identification-write.repository';
import { FilesAdapter } from '@contexts/plant-identification/infrastructure/adapters/files.adapter';
import { PlantNetIdentificationAdapter } from '@contexts/plant-identification/infrastructure/adapters/plantnet-identification.adapter';
import { PlantSpeciesAdapter } from '@contexts/plant-identification/infrastructure/adapters/plant-species.adapter';
import { PlantsAdapter } from '@contexts/plant-identification/infrastructure/adapters/plants.adapter';
import { plantnetConfig } from '@contexts/plant-identification/infrastructure/config/plantnet.config';
import { PlantIdentificationCandidateCommonNameTypeOrmEntity } from '@contexts/plant-identification/infrastructure/persistence/typeorm/entities/plant-identification-candidate-common-name.entity';
import { PlantIdentificationCandidateTypeOrmEntity } from '@contexts/plant-identification/infrastructure/persistence/typeorm/entities/plant-identification-candidate.entity';
import { PlantIdentificationPhotoTypeOrmEntity } from '@contexts/plant-identification/infrastructure/persistence/typeorm/entities/plant-identification-photo.entity';
import { PlantIdentificationTypeOrmEntity } from '@contexts/plant-identification/infrastructure/persistence/typeorm/entities/plant-identification.entity';
import { PlantIdentificationTypeOrmMapper } from '@contexts/plant-identification/infrastructure/persistence/typeorm/mappers/plant-identification-typeorm.mapper';
import { PlantIdentificationTypeOrmReadRepository } from '@contexts/plant-identification/infrastructure/persistence/typeorm/repositories/plant-identification-typeorm-read.repository';
import { PlantIdentificationTypeOrmWriteRepository } from '@contexts/plant-identification/infrastructure/persistence/typeorm/repositories/plant-identification-typeorm-write.repository';
import '@contexts/plant-identification/transport/graphql/enums/plant-identification-registered-enums.graphql';
import { PlantIdentificationGraphQLMapper } from '@contexts/plant-identification/transport/graphql/mappers/plant-identification/plant-identification.mapper';
import { PlantIdentificationMutationsResolver } from '@contexts/plant-identification/transport/graphql/resolvers/plant-identification/mutations/plant-identification-mutations.resolver';
import { PlantIdentificationQueriesResolver } from '@contexts/plant-identification/transport/graphql/resolvers/plant-identification/queries/plant-identification-queries.resolver';
import { CreatePlantFromIdentificationMcpTool } from '@contexts/plant-identification/transport/mcp/tools/create-plant-from-identification.tool';
import { PlantIdentificationFindByCriteriaMcpTool } from '@contexts/plant-identification/transport/mcp/tools/plant-identification-find-by-criteria.tool';
import { PlantIdentificationFindByIdMcpTool } from '@contexts/plant-identification/transport/mcp/tools/plant-identification-find-by-id.tool';
import { PlantIdentificationsController } from '@contexts/plant-identification/transport/rest/controllers/plant-identifications.controller';
import { PlantIdentificationRestMapper } from '@contexts/plant-identification/transport/rest/mappers/plant-identification/plant-identification.mapper';

const COMMAND_HANDLERS = [
  IdentifyPlantCommandHandler,
  CreatePlantFromIdentificationCommandHandler,
];

const QUERY_HANDLERS = [
  PlantIdentificationFindByIdQueryHandler,
  PlantIdentificationFindByCriteriaQueryHandler,
];

const DOMAIN_BUILDERS = [PlantIdentificationBuilder];

const APPLICATION_SERVICES = [
  AssertPlantIdentificationExistsService,
  AssertPlantIdentificationViewModelExistsService,
  AssertPlantIdentificationOwnershipService,
  AssertPlantIdentificationNotConvertedService,
  AssertPlantIdentificationResolvedService,
  UploadIdentificationPhotosService,
  IdentifyPlantPhotosService,
  ResolvePlantSpeciesMatchService,
];

const INFRASTRUCTURE_MAPPERS = [PlantIdentificationTypeOrmMapper];

const INFRASTRUCTURE_ENTITIES = [
  PlantIdentificationTypeOrmEntity,
  PlantIdentificationPhotoTypeOrmEntity,
  PlantIdentificationCandidateTypeOrmEntity,
  PlantIdentificationCandidateCommonNameTypeOrmEntity,
];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: PLANT_IDENTIFICATION_WRITE_REPOSITORY,
    useClass: PlantIdentificationTypeOrmWriteRepository,
  },
  {
    provide: PLANT_IDENTIFICATION_READ_REPOSITORY,
    useClass: PlantIdentificationTypeOrmReadRepository,
  },
  {
    provide: FILES_PORT,
    useClass: FilesAdapter,
  },
  {
    provide: PLANTS_PORT,
    useClass: PlantsAdapter,
  },
  {
    provide: PLANT_SPECIES_PORT,
    useClass: PlantSpeciesAdapter,
  },
  {
    provide: PLANTNET_IDENTIFICATION_PORT,
    useClass: PlantNetIdentificationAdapter,
  },
];

const REST_CONTROLLERS = [PlantIdentificationsController];
const REST_PROVIDERS = [PlantIdentificationRestMapper];

const GRAPHQL_PROVIDERS = [
  PlantIdentificationQueriesResolver,
  PlantIdentificationMutationsResolver,
  PlantIdentificationGraphQLMapper,
];

const MCP_TOOLS = [
  PlantIdentificationFindByIdMcpTool,
  PlantIdentificationFindByCriteriaMcpTool,
  CreatePlantFromIdentificationMcpTool,
];

@Module({
  imports: [
    CqrsModule,
    HttpModule,
    ConfigModule.forFeature(plantnetConfig),
    TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES),
  ],
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
export class PlantIdentificationModule {}
