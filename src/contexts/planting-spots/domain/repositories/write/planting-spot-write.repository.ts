import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

import { PlantingSpotAggregate } from '../../aggregates/planting-spot.aggregate';

export const PLANTING_SPOT_WRITE_REPOSITORY = Symbol(
  'PLANTING_SPOT_WRITE_REPOSITORY',
);

export type IPlantingSpotWriteRepository =
  IBaseWriteRepository<PlantingSpotAggregate>;
