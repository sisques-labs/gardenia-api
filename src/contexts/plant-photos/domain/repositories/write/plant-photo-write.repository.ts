import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';

export const PLANT_PHOTO_WRITE_REPOSITORY = Symbol(
  'PLANT_PHOTO_WRITE_REPOSITORY',
);

export type IPlantPhotoWriteRepository =
  IBaseWriteRepository<PlantPhotoAggregate>;
