import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface PlantSpeciesFindByIdQueryInput {
  plantSpeciesId: string;
}

export class PlantSpeciesFindByIdQuery {
  public readonly plantSpeciesId: UuidValueObject;

  constructor(input: PlantSpeciesFindByIdQueryInput) {
    this.plantSpeciesId = new UuidValueObject(input.plantSpeciesId);
  }
}
