import { NumberValueObject } from '@sisques-labs/nestjs-kit';

/** Preserves submitted photo order for display (0-based). */
export class PlantIdentificationPhotoPositionValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 0, allowDecimals: false });
  }
}
