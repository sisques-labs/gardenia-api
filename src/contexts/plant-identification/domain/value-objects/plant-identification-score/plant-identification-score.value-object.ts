import { NumberValueObject } from '@sisques-labs/nestjs-kit';

const PRECISION = 4;

/**
 * PlantNet confidence score for a single candidate, `0`–`1`. Persisted as
 * `numeric(5,4)` (see `plant_identification_candidates.score`).
 *
 * Real PlantNet scores are floating-point probabilities with far more than
 * 4 decimal places — `NumberValueObject`'s `precision` option THROWS rather
 * than rounds, so the raw value is rounded to `PRECISION` here before
 * validation, matching the `numeric(5,4)` column it's ultimately stored in.
 */
export class PlantIdentificationScoreValueObject extends NumberValueObject {
  constructor(value: number) {
    super(PlantIdentificationScoreValueObject.round(value), {
      min: 0,
      max: 1,
      allowDecimals: true,
      precision: PRECISION,
    });
  }

  private static round(value: number): number {
    const factor = 10 ** PRECISION;
    return Math.round(value * factor) / factor;
  }

  /** Domain rule: does this score clear a given confidence threshold? */
  meetsThreshold(minConfidence: number): boolean {
    return this.value >= minConfidence;
  }
}
