import { IPlantingSpotQrPrimitives } from '@contexts/planting-spots/domain/primitives/planting-spot-qr.primitives';

export class PlantingSpotQrViewModel {
  public readonly id: string;
  public readonly spaceId: string;
  public readonly targetUrl: string;
  public readonly generation: number;
  public readonly image: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: IPlantingSpotQrPrimitives) {
    this.id = props.id;
    this.spaceId = props.spaceId;
    this.targetUrl = props.targetUrl;
    this.generation = props.generation;
    this.image = props.image;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
