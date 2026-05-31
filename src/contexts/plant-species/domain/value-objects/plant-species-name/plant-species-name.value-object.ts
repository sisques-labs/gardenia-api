import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PlantSpeciesNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 200;

  constructor(value: string) {
    super(value.trim(), {
      maxLength: PlantSpeciesNameValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
