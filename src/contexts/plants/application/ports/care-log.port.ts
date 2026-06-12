export const CARE_LOG_PORT = Symbol('CARE_LOG_PORT');

export interface ICareLogPort {
  findLastActivityByType(
    plantId: string,
    activityType: string,
  ): Promise<Date | null>;
}
