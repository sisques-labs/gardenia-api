import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';

export interface PlantingSpotFindByIdQueryInput {
  id: string;
}

export class PlantingSpotFindByIdQuery {
  public readonly id: PlantingSpotIdValueObject;

  constructor(input: PlantingSpotFindByIdQueryInput) {
    this.id = new PlantingSpotIdValueObject(input.id);
  }
}
