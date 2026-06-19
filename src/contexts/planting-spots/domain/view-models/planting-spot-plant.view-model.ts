import { IPlantingSpotPlantPrimitives } from '../primitives/planting-spot-plant.primitives';

export class PlantingSpotPlantViewModel {
  public readonly id: string;
  public readonly name: string;
  public readonly plantSpeciesId: string | null;
  public readonly imageUrl: string | null;
  public readonly userId: string;
  public readonly spaceId: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: IPlantingSpotPlantPrimitives) {
    this.id = props.id;
    this.name = props.name;
    this.plantSpeciesId = props.plantSpeciesId;
    this.imageUrl = props.imageUrl;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
