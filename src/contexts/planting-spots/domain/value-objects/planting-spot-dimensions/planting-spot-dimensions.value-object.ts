import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PlantingSpotDimensionsValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 100;

  constructor(value: string) {
    super(value, {
      maxLength: PlantingSpotDimensionsValueObject.MAX_LENGTH,
      allowEmpty: true,
    });
  }
}
