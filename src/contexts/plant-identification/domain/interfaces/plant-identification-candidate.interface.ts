import { PlantIdentificationCommonNameValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-common-name/plant-identification-common-name.value-object';
import { PlantIdentificationRankValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-rank/plant-identification-rank.value-object';
import { PlantIdentificationScientificNameValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-scientific-name/plant-identification-scientific-name.value-object';
import { PlantIdentificationScoreValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-score/plant-identification-score.value-object';

/**
 * One PlantNet-ranked candidate, as embedded in `PlantIdentificationAggregate`.
 * PlantNet's raw scientific name (not GBIF-normalized — only the top-ranked,
 * auto-resolved one is, via `resolvedScientificName` on the aggregate).
 */
export interface IPlantIdentificationCandidate {
  scientificName: PlantIdentificationScientificNameValueObject;
  commonNames: PlantIdentificationCommonNameValueObject[];
  score: PlantIdentificationScoreValueObject;
  rank: PlantIdentificationRankValueObject;
}
