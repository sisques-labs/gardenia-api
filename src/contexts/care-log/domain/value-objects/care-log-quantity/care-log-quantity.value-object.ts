import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class CareLogQuantityValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value);
    if (value <= 0) {
      throw new Error('CareLogQuantityValueObject: quantity must be positive');
    }
  }
}
