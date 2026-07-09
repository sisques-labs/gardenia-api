import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';

export const PLANT_PHOTO_READ_REPOSITORY = Symbol(
  'PLANT_PHOTO_READ_REPOSITORY',
);

export type IPlantPhotoReadRepository =
  IBaseReadRepository<PlantPhotoViewModel>;
