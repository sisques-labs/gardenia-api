import { StringValueObject } from '@sisques-labs/nestjs-kit';

/** One candidate's raw scientific name, as returned by the identification provider. */
export class PlantIdentificationScientificNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 300;

  constructor(value: string) {
    super(value, {
      maxLength: PlantIdentificationScientificNameValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
