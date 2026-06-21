import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class InventoryQuantityValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 0 });
  }
}
