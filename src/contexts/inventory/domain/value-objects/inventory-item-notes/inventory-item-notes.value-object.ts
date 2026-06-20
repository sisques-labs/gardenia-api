import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class InventoryItemNotesValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 2000;

  constructor(value: string) {
    super(value, {
      maxLength: InventoryItemNotesValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
