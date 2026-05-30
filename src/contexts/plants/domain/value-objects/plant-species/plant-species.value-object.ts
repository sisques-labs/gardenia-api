import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PlantSpeciesValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 200;

  constructor(value: string) {
    super(value, {
      maxLength: PlantSpeciesValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
