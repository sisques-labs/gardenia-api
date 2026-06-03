import { PlantPlantingSpotViewModel } from '@contexts/plants/domain/view-models/plant-planting-spot.view-model';

export const PLANTING_SPOT_PORT = Symbol('PLANTING_SPOT_PORT');

export interface IPlantingSpotPort {
  findById(
    id: string,
    spaceId: string,
  ): Promise<PlantPlantingSpotViewModel | null>;
}
