import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PlantingSpotDescriptionValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 1000;

  constructor(value: string) {
    super(value, {
      maxLength: PlantingSpotDescriptionValueObject.MAX_LENGTH,
      allowEmpty: true,
    });
  }
}
