export type WaterPlantMode = 'SCHEDULE_COMPLETED' | 'CARE_LOG_CREATED';

export interface WaterPlantResult {
  plantId: string;
  mode: WaterPlantMode;
  careScheduleId?: string;
}
