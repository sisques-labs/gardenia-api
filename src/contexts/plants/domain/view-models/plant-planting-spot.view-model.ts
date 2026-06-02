export interface IPlantPlantingSpotViewModelProps {
  id: string;
  name: string;
  type: string;
  description: string | null;
  userId: string;
  spaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PlantPlantingSpotViewModel {
  public readonly id: string;
  public readonly name: string;
  public readonly type: string;
  public readonly description: string | null;
  public readonly userId: string;
  public readonly spaceId: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: IPlantPlantingSpotViewModelProps) {
    this.id = props.id;
    this.name = props.name;
    this.type = props.type;
    this.description = props.description;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
