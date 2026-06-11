import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PlantSpeciesDescriptionValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 2000;

  constructor(value: string) {
    super(value, {
      maxLength: PlantSpeciesDescriptionValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
