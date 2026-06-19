import { IPlantingSpotPrimitives } from '@contexts/planting-spots/domain/primitives/planting-spot.primitives';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';

export type PlantingSpotFindByIdQueryInput = Pick<
  IPlantingSpotPrimitives,
  'id'
> & {
  resolve?: boolean;
};

export class PlantingSpotFindByIdQuery {
  public readonly id: PlantingSpotIdValueObject;
  public readonly resolve: boolean;

  constructor(input: PlantingSpotFindByIdQueryInput) {
    this.id = new PlantingSpotIdValueObject(input.id);
    this.resolve = input.resolve ?? false;
  }
}
