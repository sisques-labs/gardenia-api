import { PlantingSpotAggregate } from '../../aggregates/planting-spot.aggregate';

export const PLANTING_SPOT_WRITE_REPOSITORY = Symbol(
  'PLANTING_SPOT_WRITE_REPOSITORY',
);

export interface IPlantingSpotWriteRepository {
  save(spot: PlantingSpotAggregate): Promise<void>;
  findById(id: string, spaceId: string): Promise<PlantingSpotAggregate | null>;
  delete(id: string): Promise<void>;
}
