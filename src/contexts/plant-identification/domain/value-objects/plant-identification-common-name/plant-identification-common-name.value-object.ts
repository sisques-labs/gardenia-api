import { StringValueObject } from '@sisques-labs/nestjs-kit';

/** One common name reported for a candidate. */
export class PlantIdentificationCommonNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 200;

  constructor(value: string) {
    super(value, {
      maxLength: PlantIdentificationCommonNameValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
