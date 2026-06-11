import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PlantSpeciesScientificNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 300;

  constructor(value: string) {
    super(value.trim(), {
      maxLength: PlantSpeciesScientificNameValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
