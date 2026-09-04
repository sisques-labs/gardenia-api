import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface PlantingSpotFindByIdQueryInput {
  id: string;
}

export class PlantingSpotFindByIdQuery {
  public readonly id: UuidValueObject;

  constructor(input: PlantingSpotFindByIdQueryInput) {
    this.id = new UuidValueObject(input.id);
  }
}
