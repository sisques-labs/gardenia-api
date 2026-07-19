import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';

export const PLANT_IDENTIFICATION_WRITE_REPOSITORY = Symbol(
  'PLANT_IDENTIFICATION_WRITE_REPOSITORY',
);

export type IPlantIdentificationWriteRepository =
  IBaseWriteRepository<PlantIdentificationAggregate>;
