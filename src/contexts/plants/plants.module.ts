import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreatePlantCommandHandler } from './application/commands/create-plant/create-plant.handler';
import { DeletePlantCommandHandler } from './application/commands/delete-plant/delete-plant.handler';
import { UpdatePlantCommandHandler } from './application/commands/update-plant/update-plant.handler';
import { PlantFindByCriteriaQueryHandler } from './application/queries/plant-find-by-criteria/plant-find-by-criteria.handler';
import { PlantFindByIdQueryHandler } from './application/queries/plant-find-by-id/plant-find-by-id.handler';
import { AssertPlantViewModelExistsService } from './application/services/read/assert-plant-view-model-exists/assert-plant-view-model-exists.service';
import { AssertPlantExistsService } from './application/services/write/assert-plant-exists/assert-plant-exists.service';
import { PlantBuilder } from './domain/builders/plant.builder';
import { PLANT_READ_REPOSITORY } from './domain/repositories/read/plant-read.repository';
import { PLANT_WRITE_REPOSITORY } from './domain/repositories/write/plant-write.repository';
import { PlantTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/plant.entity';
import { PlantTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/plant-typeorm.mapper';
import { PlantTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/plant-typeorm-read.repository';
import { PlantTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/plant-typeorm-write.repository';
import './transport/graphql/enums/plant/plant-registered-enums.graphql';

const COMMAND_HANDLERS = [
  CreatePlantCommandHandler,
  UpdatePlantCommandHandler,
  DeletePlantCommandHandler,
];

const QUERY_HANDLERS = [
  PlantFindByIdQueryHandler,
  PlantFindByCriteriaQueryHandler,
];

const APPLICATION_SERVICES = [
  AssertPlantViewModelExistsService,
  AssertPlantExistsService,
];

const DOMAIN_BUILDERS = [PlantBuilder];

const INFRASTRUCTURE_MAPPERS = [PlantTypeOrmMapper];

const INFRASTRUCTURE_REPOSITORIES = [
  { provide: PLANT_READ_REPOSITORY, useClass: PlantTypeOrmReadRepository },
  { provide: PLANT_WRITE_REPOSITORY, useClass: PlantTypeOrmWriteRepository },
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([PlantTypeOrmEntity])],
  controllers: [],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...APPLICATION_SERVICES,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
  ],
  exports: [],
})
export class PlantsModule {}
