import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class CareLogQuantityValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 1 });
  }
}
