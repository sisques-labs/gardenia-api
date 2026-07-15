import { PlantNetIdentificationCandidateResult } from '@contexts/plant-identification/application/ports/plantnet-identification-candidate.result';
import { PlantNetIdentificationImageInput } from '@contexts/plant-identification/application/ports/plantnet-identification-image.input';

export const PLANTNET_IDENTIFICATION_PORT = Symbol(
  'PLANTNET_IDENTIFICATION_PORT',
);

/**
 * Seam into the PlantNet external identification API. Implemented by
 * `PlantNetIdentificationAdapter` (`POST /v2/identify/{project}`). Sends
 * every submitted photo (with its organ) in a single request — PlantNet uses
 * the extra images/organs of the same plant to improve confidence in one
 * scored result.
 *
 * Errors: throws `PlantIdentificationQuotaExceededException` on a 429
 * response, `PlantIdentificationProviderUnavailableException` on any other
 * non-2xx response, timeout, or network error. A successful call that
 * returns zero/low-confidence candidates is NOT an error — it resolves to an
 * array (possibly empty), sorted by PlantNet descending by score.
 */
export interface IPlantNetIdentificationPort {
  identify(
    images: PlantNetIdentificationImageInput[],
    project?: string,
  ): Promise<PlantNetIdentificationCandidateResult[]>;
}
