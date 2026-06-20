import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class InventoryAdjustmentReasonValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 500;

  constructor(value: string) {
    super(value, {
      maxLength: InventoryAdjustmentReasonValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
