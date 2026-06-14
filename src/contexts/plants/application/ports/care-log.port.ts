export const CARE_LOG_PORT = Symbol('CARE_LOG_PORT');

export interface CareLogSummary {
  lastWateredAt: Date | null;
  lastFertilizedAt: Date | null;
}

export interface ICareLogPort {
  getCareLogSummary(plantId: string): Promise<CareLogSummary>;
}
