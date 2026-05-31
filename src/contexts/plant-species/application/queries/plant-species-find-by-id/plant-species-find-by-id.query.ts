import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';

export interface PlantSpeciesFindByIdQueryInput {
  plantSpeciesId: string;
}

export class PlantSpeciesFindByIdQuery {
  public readonly plantSpeciesId: PlantSpeciesIdValueObject;

  constructor(input: PlantSpeciesFindByIdQueryInput) {
    this.plantSpeciesId = new PlantSpeciesIdValueObject(input.plantSpeciesId);
  }
}
