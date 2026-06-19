import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class PlantingSpotColumnValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 1 });
  }
}
