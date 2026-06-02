import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';

export interface PlantingSpotFindByIdQueryInput {
  spotId: string;
  spaceId: string;
}

export class PlantingSpotFindByIdQuery {
  public readonly spotId: PlantingSpotIdValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: PlantingSpotFindByIdQueryInput) {
    this.spotId = new PlantingSpotIdValueObject(input.spotId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}
