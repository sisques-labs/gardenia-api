import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PLANT_QR_PORT } from '@contexts/plants/application/ports/plant-qr.port';
import { PLANT_SPECIES_PORT } from '@contexts/plants/application/ports/plant-species.port';
import { PLANTING_SPOT_PORT } from '@contexts/plants/application/ports/planting-spot.port';
import { PlantQrAdapter } from '@contexts/plants/infrastructure/adapters/plant-qr.adapter';
import { PlantSpeciesAdapter } from '@contexts/plants/infrastructure/adapters/plant-species.adapter';
import { PlantingSpotAdapter } from '@contexts/plants/infrastructure/adapters/planting-spot.adapter';
import { CreatePlantCommandHandler } from './application/commands/create-plant/create-plant.handler';
import { DeletePlantCommandHandler } from './application/commands/delete-plant/delete-plant.handler';
import { SetPlantQrIdCommandHandler } from './application/commands/set-plant-qr-id/set-plant-qr-id.handler';
import { UpdatePlantCommandHandler } from './application/commands/update-plant/update-plant.handler';
import { PlantFindByCriteriaQueryHandler } from './application/queries/plant-find-by-criteria/plant-find-by-criteria.handler';
import { PlantFindByIdQueryHandler } from './application/queries/plant-find-by-id/plant-find-by-id.handler';
import { AssertPlantViewModelExistsService } from './application/services/read/assert-plant-view-model-exists/assert-plant-view-model-exists.service';
import { EnrichPlantWithQrService } from './application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service';
import { EnrichPlantWithSpeciesService } from './application/services/read/enrich-plant-with-species/enrich-plant-with-species.service';
import { PlantQrTargetUrlBuilderService } from './application/services/read/plant-qr-target-url-builder/plant-qr-target-url-builder.service';
import { AssertPlantExistsService } from './application/services/write/assert-plant-exists/assert-plant-exists.service';
import { AssertPlantLinkedSpeciesExistsService } from './application/services/write/assert-plant-linked-species-exists/assert-plant-linked-species-exists.service';
import { PlantPlantingSpotBuilder } from './domain/builders/plant-planting-spot.builder';
import { PlantQrBuilder } from './domain/builders/plant-qr.builder';
import { PlantSpeciesBuilder } from './domain/builders/plant-species.builder';
import { PlantBuilder } from './domain/builders/plant.builder';
import { PLANT_READ_REPOSITORY } from './domain/repositories/read/plant-read.repository';
import { PLANT_WRITE_REPOSITORY } from './domain/repositories/write/plant-write.repository';
import { PlantTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/plant.entity';
import { PlantTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/plant-typeorm.mapper';
import { PlantTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/plant-typeorm-read.repository';
import { PlantTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/plant-typeorm-write.repository';
import './transport/graphql/enums/plant/plant-registered-enums.graphql';
import { PlantGraphQLMapper } from './transport/graphql/mappers/plant/plant.mapper';
import { PlantMutationsResolver } from './transport/graphql/resolvers/plant/plant-mutations.resolver';
import { PlantQueriesResolver } from './transport/graphql/resolvers/plant/plant-queries.resolver';
import { PlantQrResolvedFieldResolver } from './transport/graphql/resolvers/plant/plant-qr-resolved-field.resolver';
import { PlantResolvedFieldsResolver } from './transport/graphql/resolvers/plant/plant-resolved-fields.resolver';
import { PlantSpeciesResolvedFieldResolver } from './transport/graphql/resolvers/plant/plant-species-resolved-field.resolver';
import { PlantsController } from './transport/rest/controllers/plants.controller';
import { PlantRestMapper } from './transport/rest/mappers/plant/plant.mapper';

const COMMAND_HANDLERS = [
  CreatePlantCommandHandler,
  UpdatePlantCommandHandler,
  DeletePlantCommandHandler,
  SetPlantQrIdCommandHandler,
];

const QUERY_HANDLERS = [
  PlantFindByIdQueryHandler,
  PlantFindByCriteriaQueryHandler,
];

const APPLICATION_SERVICES = [
  AssertPlantViewModelExistsService,
  AssertPlantExistsService,
  EnrichPlantWithSpeciesService,
  EnrichPlantWithQrService,
  PlantQrTargetUrlBuilderService,
  AssertPlantLinkedSpeciesExistsService,
];

const DOMAIN_BUILDERS = [
  PlantBuilder,
  PlantQrBuilder,
  PlantSpeciesBuilder,
  PlantPlantingSpotBuilder,
];

const INFRASTRUCTURE_MAPPERS = [PlantTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  { provide: PLANT_READ_REPOSITORY, useClass: PlantTypeOrmReadRepository },
  { provide: PLANT_WRITE_REPOSITORY, useClass: PlantTypeOrmWriteRepository },
];

const INFRASTRUCTURE_ADAPTERS = [
  { provide: PLANT_QR_PORT, useClass: PlantQrAdapter },
  { provide: PLANT_SPECIES_PORT, useClass: PlantSpeciesAdapter },
  { provide: PLANTING_SPOT_PORT, useClass: PlantingSpotAdapter },
];

const REST_CONTROLLERS = [PlantsController];
const REST_PROVIDERS = [PlantRestMapper];
const GRAPHQL_PROVIDERS = [
  PlantQueriesResolver,
  PlantMutationsResolver,
  PlantResolvedFieldsResolver,
  PlantQrResolvedFieldResolver,
  PlantSpeciesResolvedFieldResolver,
  PlantGraphQLMapper,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([PlantTypeOrmEntity])],
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
  ],
  exports: [],
})
export class PlantsModule {}
