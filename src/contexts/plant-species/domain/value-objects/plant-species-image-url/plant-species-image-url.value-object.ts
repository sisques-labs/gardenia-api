import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PlantSpeciesImageUrlValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 500;

  constructor(value: string) {
    super(value, {
      maxLength: PlantSpeciesImageUrlValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
