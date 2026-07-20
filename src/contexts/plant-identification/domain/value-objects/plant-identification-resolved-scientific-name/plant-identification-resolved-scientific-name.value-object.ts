import { StringValueObject } from '@sisques-labs/nestjs-kit';

/** The top candidate's scientific name once auto-resolved against the species catalog. */
export class PlantIdentificationResolvedScientificNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 300;

  constructor(value: string) {
    super(value, {
      maxLength:
        PlantIdentificationResolvedScientificNameValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
