import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type FindLatestReadingsByPlantQueryInput = { plantId: string };

export class FindLatestReadingsByPlantQuery {
  public readonly plantId: UuidValueObject;

  constructor(input: FindLatestReadingsByPlantQueryInput) {
    this.plantId = new UuidValueObject(input.plantId);
  }
}
