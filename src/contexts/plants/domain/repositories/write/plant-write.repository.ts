import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { PlantAggregate } from '../../aggregates/plant.aggregate';

export const PLANT_WRITE_REPOSITORY = Symbol('PLANT_WRITE_REPOSITORY');

export type IPlantWriteRepository = IBaseWriteRepository<PlantAggregate>;
