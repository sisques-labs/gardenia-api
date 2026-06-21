import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class InventoryItemBrandValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 200;

  constructor(value: string) {
    super(value, {
      maxLength: InventoryItemBrandValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
