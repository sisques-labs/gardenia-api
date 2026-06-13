import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class HarvestQuantityValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 0.001 });
  }
}
