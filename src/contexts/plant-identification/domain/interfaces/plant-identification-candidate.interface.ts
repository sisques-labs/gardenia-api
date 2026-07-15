import { NumberValueObject, StringValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationScoreValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-score/plant-identification-score.value-object';

/**
 * One PlantNet-ranked candidate, as embedded in `PlantIdentificationAggregate`.
 * PlantNet's raw scientific name (not GBIF-normalized — only the top-ranked,
 * auto-resolved one is, via `resolvedScientificName` on the aggregate).
 */
export interface IPlantIdentificationCandidate {
  scientificName: StringValueObject;
  /**
   * Plain string array, not individually wrapped — a free-text display list
   * with no per-item business rule to enforce, same reasoning `FILES_ALLOWED_
   * MIME_TYPES` config values are left as plain strings once split.
   */
  commonNames: string[];
  score: PlantIdentificationScoreValueObject;
  /** Preserves PlantNet's own ranking order. */
  rank: NumberValueObject;
}
