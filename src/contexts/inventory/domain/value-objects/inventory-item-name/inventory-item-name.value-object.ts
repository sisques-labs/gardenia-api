import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class InventoryItemNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 200;

  constructor(value: string) {
    super(value, {
      maxLength: InventoryItemNameValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
