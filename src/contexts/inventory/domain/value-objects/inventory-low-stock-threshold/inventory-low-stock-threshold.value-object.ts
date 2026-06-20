import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class InventoryLowStockThresholdValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 0 });
  }
}
