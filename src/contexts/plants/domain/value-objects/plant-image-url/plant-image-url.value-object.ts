import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PlantImageUrlValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 500;

  constructor(value: string) {
    super(value, {
      maxLength: PlantImageUrlValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
