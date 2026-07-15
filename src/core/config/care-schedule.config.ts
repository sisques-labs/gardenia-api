import { registerAs } from '@nestjs/config';

export interface ICareScheduleConfig {
  dueWindowHours: number;
}

export const careScheduleConfig = registerAs(
  'careSchedule',
  (): ICareScheduleConfig => ({
    dueWindowHours: Number(process.env.CARE_SCHEDULE_DUE_WINDOW_HOURS ?? 24),
  }),
);
