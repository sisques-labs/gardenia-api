import { DateValueObject } from '@sisques-labs/nestjs-kit';

export class InventoryAcquiredAtValueObject extends DateValueObject {
  constructor(value: Date) {
    super(value);
  }
}
