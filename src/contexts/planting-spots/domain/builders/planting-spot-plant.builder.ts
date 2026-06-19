import { IPlantingSpotPlantPrimitives } from '../primitives/planting-spot-plant.primitives';
import { PlantingSpotPlantViewModel } from '../view-models/planting-spot-plant.view-model';

export class PlantingSpotPlantBuilder {
  static buildViewModel(
    props: IPlantingSpotPlantPrimitives,
  ): PlantingSpotPlantViewModel {
    return new PlantingSpotPlantViewModel(props);
  }
}
