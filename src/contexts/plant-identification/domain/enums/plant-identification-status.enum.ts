/**
 * Outcome of a completed `IdentifyPlant` attempt. A row only ever exists for
 * a *completed* PlantNet call — provider failures never reach persistence
 * (see `PlantIdentificationProviderUnavailableException`/
 * `PlantIdentificationQuotaExceededException`).
 */
export enum PlantIdentificationStatusEnum {
  RESOLVED = 'RESOLVED',
  NO_MATCH = 'NO_MATCH',
}
