import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeletePlantPhotoCommandHandler } from '@contexts/plant-photos/application/commands/delete-plant-photo/delete-plant-photo.handler';
import { UploadPlantPhotoCommandHandler } from '@contexts/plant-photos/application/commands/upload-plant-photo/upload-plant-photo.handler';
import { FILES_PORT } from '@contexts/plant-photos/application/ports/files.port';
import { PLANTS_PORT } from '@contexts/plant-photos/application/ports/plants.port';
import { PlantPhotoFindByCriteriaQueryHandler } from '@contexts/plant-photos/application/queries/plant-photo-find-by-criteria/plant-photo-find-by-criteria.handler';
import { PlantPhotoFindByIdQueryHandler } from '@contexts/plant-photos/application/queries/plant-photo-find-by-id/plant-photo-find-by-id.handler';
import { AssertPlantPhotoViewModelExistsService } from '@contexts/plant-photos/application/services/read/assert-plant-photo-view-model-exists/assert-plant-photo-view-model-exists.service';
import { AssertPlantPhotoExistsService } from '@contexts/plant-photos/application/services/write/assert-plant-photo-exists/assert-plant-photo-exists.service';
import { PlantPhotoBuilder } from '@contexts/plant-photos/domain/builders/plant-photo.builder';
import { PLANT_PHOTO_READ_REPOSITORY } from '@contexts/plant-photos/domain/repositories/read/plant-photo-read.repository';
import { PLANT_PHOTO_WRITE_REPOSITORY } from '@contexts/plant-photos/domain/repositories/write/plant-photo-write.repository';
import { FilesAdapter } from '@contexts/plant-photos/infrastructure/adapters/files.adapter';
import { PlantsAdapter } from '@contexts/plant-photos/infrastructure/adapters/plants.adapter';
import { PlantPhotoTypeOrmEntity } from '@contexts/plant-photos/infrastructure/persistence/typeorm/entities/plant-photo.entity';
import { PlantPhotoTypeOrmMapper } from '@contexts/plant-photos/infrastructure/persistence/typeorm/mappers/plant-photo-typeorm.mapper';
import { PlantPhotoTypeOrmReadRepository } from '@contexts/plant-photos/infrastructure/persistence/typeorm/repositories/plant-photo-typeorm-read.repository';
import { PlantPhotoTypeOrmWriteRepository } from '@contexts/plant-photos/infrastructure/persistence/typeorm/repositories/plant-photo-typeorm-write.repository';
import '@contexts/plant-photos/transport/graphql/enums/plant-photo-registered-enums.graphql';
import { PlantPhotoGraphQLMapper } from '@contexts/plant-photos/transport/graphql/mappers/plant-photo/plant-photo.mapper';
import { PlantPhotoMutationsResolver } from '@contexts/plant-photos/transport/graphql/resolvers/plant-photo/mutations/plant-photo-mutations.resolver';
import { PlantPhotoQueriesResolver } from '@contexts/plant-photos/transport/graphql/resolvers/plant-photo/queries/plant-photo-queries.resolver';
import { PlantPhotoDeleteMcpTool } from '@contexts/plant-photos/transport/mcp/tools/plant-photo-delete.tool';
import { PlantPhotoFindByCriteriaMcpTool } from '@contexts/plant-photos/transport/mcp/tools/plant-photo-find-by-criteria.tool';
import { PlantPhotoFindByIdMcpTool } from '@contexts/plant-photos/transport/mcp/tools/plant-photo-find-by-id.tool';
import { PlantPhotosController } from '@contexts/plant-photos/transport/rest/controllers/plant-photos.controller';
import { PlantPhotoRestMapper } from '@contexts/plant-photos/transport/rest/mappers/plant-photo/plant-photo.mapper';

const COMMAND_HANDLERS = [
  UploadPlantPhotoCommandHandler,
  DeletePlantPhotoCommandHandler,
];

const QUERY_HANDLERS = [
  PlantPhotoFindByIdQueryHandler,
  PlantPhotoFindByCriteriaQueryHandler,
];

const DOMAIN_BUILDERS = [PlantPhotoBuilder];

const APPLICATION_SERVICES = [
  AssertPlantPhotoExistsService,
  AssertPlantPhotoViewModelExistsService,
];

const INFRASTRUCTURE_MAPPERS = [PlantPhotoTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: PLANT_PHOTO_WRITE_REPOSITORY,
    useClass: PlantPhotoTypeOrmWriteRepository,
  },
  {
    provide: PLANT_PHOTO_READ_REPOSITORY,
    useClass: PlantPhotoTypeOrmReadRepository,
  },
  {
    provide: FILES_PORT,
    useClass: FilesAdapter,
  },
  {
    provide: PLANTS_PORT,
    useClass: PlantsAdapter,
  },
];

const INFRASTRUCTURE_ENTITIES = [PlantPhotoTypeOrmEntity];

const REST_CONTROLLERS = [PlantPhotosController];
const REST_PROVIDERS = [PlantPhotoRestMapper];

const GRAPHQL_PROVIDERS = [
  PlantPhotoQueriesResolver,
  PlantPhotoMutationsResolver,
  PlantPhotoGraphQLMapper,
];

const MCP_TOOLS = [
  PlantPhotoFindByIdMcpTool,
  PlantPhotoFindByCriteriaMcpTool,
  PlantPhotoDeleteMcpTool,
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
export class PlantPhotosModule {}
