import { IPlantPrimitives } from '@contexts/plants/domain/primitives/plant.primitives';
import { BaseViewModel } from '@sisques-labs/nestjs-kit';

export class PlantViewModel extends BaseViewModel {
  public readonly name: string;
  public readonly species: string | null;
  public readonly imageUrl: string | null;
  public readonly userId: string;
  public readonly spaceId: string;
  public readonly qrId: string | null;
  public readonly targetUrl: string | null;

  constructor(props: IPlantPrimitives & { targetUrl?: string | null }) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.species = props.species;
    this.imageUrl = props.imageUrl;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
    this.qrId = props.qrId;
    this.targetUrl = props.targetUrl ?? null;
  }
}
