import { NumberValueObject } from '@sisques-labs/nestjs-kit';

/** Preserves the provider's own candidate ranking order (0-based). */
export class PlantIdentificationRankValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 0, allowDecimals: false });
  }
}
