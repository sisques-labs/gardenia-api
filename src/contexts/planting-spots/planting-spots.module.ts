import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PLANTING_SPOT_IN_USE_PORT } from './application/ports/planting-spot-in-use.port';
import { CreatePlantingSpotCommandHandler } from './application/commands/create-planting-spot/create-planting-spot.handler';
import { DeletePlantingSpotCommandHandler } from './application/commands/delete-planting-spot/delete-planting-spot.handler';
import { UpdatePlantingSpotCommandHandler } from './application/commands/update-planting-spot/update-planting-spot.handler';
import { PlantingSpotFindByCriteriaQueryHandler } from './application/queries/planting-spot-find-by-criteria/planting-spot-find-by-criteria.handler';
import { PlantingSpotFindByIdQueryHandler } from './application/queries/planting-spot-find-by-id/planting-spot-find-by-id.handler';
import { AssertPlantingSpotViewModelExistsService } from './application/services/read/assert-planting-spot-view-model-exists/assert-planting-spot-view-model-exists.service';
import { AssertPlantingSpotExistsService } from './application/services/write/assert-planting-spot-exists/assert-planting-spot-exists.service';
import { AssertPlantingSpotNotInUseService } from './application/services/write/assert-planting-spot-not-in-use/assert-planting-spot-not-in-use.service';
import { PLANTING_SPOT_READ_REPOSITORY } from './domain/repositories/read/planting-spot-read.repository';
import { PLANTING_SPOT_WRITE_REPOSITORY } from './domain/repositories/write/planting-spot-write.repository';
import { PlantingSpotInUseAdapter } from './infrastructure/adapters/planting-spot-in-use.adapter';
import { PlantingSpotTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/planting-spot.entity';
import { PlantingSpotTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/planting-spot-typeorm.mapper';
import { PlantingSpotTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/planting-spot-typeorm-read.repository';
import { PlantingSpotTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/planting-spot-typeorm-write.repository';
import './transport/graphql/enums/planting-spot-registered-enums.graphql';
import { PlantingSpotGraphQLMapper } from './transport/graphql/mappers/planting-spot/planting-spot.mapper';
import { PlantingSpotMutationsResolver } from './transport/graphql/resolvers/planting-spot-mutations.resolver';
import { PlantingSpotQueriesResolver } from './transport/graphql/resolvers/planting-spot-queries.resolver';
import { PlantingSpotsController } from './transport/rest/controllers/planting-spots.controller';
import { PlantingSpotRestMapper } from './transport/rest/mappers/planting-spot/planting-spot.mapper';

const COMMAND_HANDLERS = [
  CreatePlantingSpotCommandHandler,
  UpdatePlantingSpotCommandHandler,
  DeletePlantingSpotCommandHandler,
];

const QUERY_HANDLERS = [
  PlantingSpotFindByIdQueryHandler,
  PlantingSpotFindByCriteriaQueryHandler,
];

const APPLICATION_SERVICES = [
  AssertPlantingSpotExistsService,
  AssertPlantingSpotNotInUseService,
  AssertPlantingSpotViewModelExistsService,
];

const INFRASTRUCTURE_MAPPERS = [PlantingSpotTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  {
    provide: PLANTING_SPOT_WRITE_REPOSITORY,
    useClass: PlantingSpotTypeOrmWriteRepository,
  },
  {
    provide: PLANTING_SPOT_READ_REPOSITORY,
    useClass: PlantingSpotTypeOrmReadRepository,
  },
];

const INFRASTRUCTURE_ADAPTERS = [
  {
    provide: PLANTING_SPOT_IN_USE_PORT,
    useClass: PlantingSpotInUseAdapter,
  },
];

const REST_CONTROLLERS = [PlantingSpotsController];
const REST_PROVIDERS = [PlantingSpotRestMapper];

const GRAPHQL_PROVIDERS = [
  PlantingSpotQueriesResolver,
  PlantingSpotMutationsResolver,
  PlantingSpotGraphQLMapper,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([PlantingSpotTypeOrmEntity])],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...APPLICATION_SERVICES,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...INFRASTRUCTURE_ADAPTERS,
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
  ],
  exports: [],
})
export class PlantingSpotsModule {}
