export class PlantQrViewModel {
  public readonly id: string;
  public readonly spaceId: string;
  public readonly targetUrl: string;
  public readonly generation: number;
  public readonly image: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: {
    id: string;
    spaceId: string;
    targetUrl: string;
    generation: number;
    image: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.spaceId = props.spaceId;
    this.targetUrl = props.targetUrl;
    this.generation = props.generation;
    this.image = props.image;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
