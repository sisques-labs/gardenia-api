import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PlantNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 100;

  constructor(value: string) {
    super(value, {
      maxLength: PlantNameValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
