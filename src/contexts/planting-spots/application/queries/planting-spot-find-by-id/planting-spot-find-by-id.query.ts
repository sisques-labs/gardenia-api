import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IPlantingSpotPrimitives } from '@contexts/planting-spots/domain/primitives/planting-spot.primitives';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';

export type PlantingSpotFindByIdQueryInput = Pick<
  IPlantingSpotPrimitives,
  'id' | 'spaceId'
>;

export class PlantingSpotFindByIdQuery {
  public readonly id: PlantingSpotIdValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: PlantingSpotFindByIdQueryInput) {
    this.id = new PlantingSpotIdValueObject(input.id);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}
