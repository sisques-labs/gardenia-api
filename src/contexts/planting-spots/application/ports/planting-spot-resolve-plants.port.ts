import { PlantingSpotPlantViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-plant.view-model';

export const PLANTING_SPOT_RESOLVE_PLANTS_PORT = Symbol(
  'PLANTING_SPOT_RESOLVE_PLANTS_PORT',
);

export interface IPlantingSpotResolvePlantsPort {
  findByPlantingSpotId(
    plantingSpotId: string,
  ): Promise<PlantingSpotPlantViewModel[]>;
}
