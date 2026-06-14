export const CARE_LOG_PORT = Symbol('CARE_LOG_PORT');

export interface CareLogSummary {
  lastWateredAt: Date | null;
  lastFertilizedAt: Date | null;
  lastPrunedAt: Date | null;
  lastRepottedAt: Date | null;
  lastTransplantedAt: Date | null;
  lastPestTreatmentAt: Date | null;
  lastMistedAt: Date | null;
  lastRotatedAt: Date | null;
  lastOtherAt: Date | null;
}

export interface ICareLogPort {
  getCareLogSummary(plantId: string): Promise<CareLogSummary>;
}
