import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { PlantViewModel } from '../../view-models/plant.view-model';

export const PLANT_READ_REPOSITORY = Symbol('PLANT_READ_REPOSITORY');

export type IPlantReadRepository = IBaseReadRepository<PlantViewModel>;
