import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class PlantingSpotCapacityValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 1 });
  }
}
