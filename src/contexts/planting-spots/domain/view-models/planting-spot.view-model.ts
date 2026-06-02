import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IPlantingSpotPrimitives } from '../primitives/planting-spot.primitives';

export class PlantingSpotViewModel extends BaseViewModel {
  public readonly name: string;
  public readonly type: string;
  public readonly description: string | null;
  public readonly userId: string;
  public readonly spaceId: string;

  constructor(props: IPlantingSpotPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.type = props.type;
    this.description = props.description;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
  }
}
