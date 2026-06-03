import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PlantingSpotNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 255;

  constructor(value: string) {
    super(value, {
      maxLength: PlantingSpotNameValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
