import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface PlantFindByIdQueryInput {
  plantId: string;
}

export class PlantFindByIdQuery {
  public readonly plantId: UuidValueObject;

  constructor(input: PlantFindByIdQueryInput) {
    this.plantId = new UuidValueObject(input.plantId);
  }
}
