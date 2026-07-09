import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Denormalized copy of the `files` context's resolved `FileUrlValueObject` at
 * upload time. Files are immutable, so this never drifts from its source.
 */
export class PlantPhotoUrlValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 1024;

  constructor(value: string) {
    super(value, {
      maxLength: PlantPhotoUrlValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}
