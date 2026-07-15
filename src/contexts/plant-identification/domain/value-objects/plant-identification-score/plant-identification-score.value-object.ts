import { NumberValueObject } from '@sisques-labs/nestjs-kit';

/**
 * PlantNet confidence score for a single candidate, `0`–`1`. Persisted as
 * `numeric(5,4)` (see `plant_identification_candidates.score`).
 */
export class PlantIdentificationScoreValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 0, max: 1, allowDecimals: true, precision: 4 });
  }
}
