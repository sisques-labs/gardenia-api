import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class InventoryExpiringWindowDaysValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 1 });
  }
}
