import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class InventoryItemIdValueObject extends UuidValueObject {
  constructor(value: string) {
    super(value);
  }
}
