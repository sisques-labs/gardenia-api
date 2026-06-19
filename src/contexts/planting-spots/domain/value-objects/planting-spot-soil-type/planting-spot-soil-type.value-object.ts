import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PlantingSpotSoilTypeValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 100;

  constructor(value: string) {
    super(value, {
      maxLength: PlantingSpotSoilTypeValueObject.MAX_LENGTH,
      allowEmpty: true,
    });
  }
}
