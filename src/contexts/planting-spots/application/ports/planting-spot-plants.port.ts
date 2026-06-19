import { PlantingSpotPlantViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-plant.view-model';

export const PLANTING_SPOT_PLANTS_PORT = Symbol('PLANTING_SPOT_PLANTS_PORT');

export interface IPlantingSpotPlantsPort {
  findByPlantingSpotId(
    plantingSpotId: string,
  ): Promise<PlantingSpotPlantViewModel[]>;
}
