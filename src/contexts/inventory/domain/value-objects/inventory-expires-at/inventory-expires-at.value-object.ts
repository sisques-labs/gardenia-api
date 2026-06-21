import { DateValueObject } from '@sisques-labs/nestjs-kit';

export class InventoryExpiresAtValueObject extends DateValueObject {
  constructor(value: Date) {
    super(value);
  }
}
