import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class HarvestCropTypeValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 200;

  constructor(value: string) {
    super(value, {
      maxLength: HarvestCropTypeValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
