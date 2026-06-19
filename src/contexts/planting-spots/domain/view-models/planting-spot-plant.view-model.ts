import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IPlantingSpotPlantPrimitives } from '../primitives/planting-spot-plant.primitives';

export class PlantingSpotPlantViewModel extends BaseViewModel {
  public readonly name: string;
  public readonly plantSpeciesId: string | null;
  public readonly imageUrl: string | null;
  public readonly userId: string;
  public readonly spaceId: string;

  constructor(props: IPlantingSpotPlantPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.plantSpeciesId = props.plantSpeciesId;
    this.imageUrl = props.imageUrl;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
  }
}
