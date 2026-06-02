import { PlantingSpotTypeEnum } from '../../enums/planting-spot-type.enum';
import { PlantingSpotViewModel } from '../../view-models/planting-spot.view-model';

export const PLANTING_SPOT_READ_REPOSITORY = Symbol(
  'PLANTING_SPOT_READ_REPOSITORY',
);

export type PlantingSpotCriteria = {
  spaceId: string;
  type?: PlantingSpotTypeEnum;
  page?: number;
  limit?: number;
};

export interface IPlantingSpotReadRepository {
  findById(id: string, spaceId: string): Promise<PlantingSpotViewModel | null>;
  findByCriteria(
    criteria: PlantingSpotCriteria,
  ): Promise<PlantingSpotViewModel[]>;
}
