import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IPlantPrimitives } from '../primitives/plant.primitives';

export class PlantViewModel extends BaseViewModel {
  public readonly name: string;
  public readonly species: string | null;
  public readonly imageUrl: string | null;
  public readonly userId: string;
  public readonly spaceId: string;

  constructor(props: IPlantPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.species = props.species;
    this.imageUrl = props.imageUrl;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
  }
}
