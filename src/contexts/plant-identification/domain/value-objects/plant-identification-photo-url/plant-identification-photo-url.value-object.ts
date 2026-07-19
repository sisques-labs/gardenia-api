import { StringValueObject } from '@sisques-labs/nestjs-kit';

/** Denormalized copy of the `files` context's resolved URL at upload time. */
export class PlantIdentificationPhotoUrlValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 1024;

  constructor(value: string) {
    super(value, {
      maxLength: PlantIdentificationPhotoUrlValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
