import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';

export interface PlantFindByIdQueryInput {
  plantId: string;
}

export class PlantFindByIdQuery {
  public readonly plantId: PlantIdValueObject;

  constructor(input: PlantFindByIdQueryInput) {
    this.plantId = new PlantIdValueObject(input.plantId);
  }
}
