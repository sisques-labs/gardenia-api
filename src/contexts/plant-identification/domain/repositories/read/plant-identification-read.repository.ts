import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';

export const PLANT_IDENTIFICATION_READ_REPOSITORY = Symbol(
  'PLANT_IDENTIFICATION_READ_REPOSITORY',
);

export type IPlantIdentificationReadRepository =
  IBaseReadRepository<PlantIdentificationViewModel>;
