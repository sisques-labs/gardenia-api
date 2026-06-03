import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { PlantingSpotViewModel } from '../../view-models/planting-spot.view-model';

export const PLANTING_SPOT_READ_REPOSITORY = Symbol(
  'PLANTING_SPOT_READ_REPOSITORY',
);

export type IPlantingSpotReadRepository =
  IBaseReadRepository<PlantingSpotViewModel>;
