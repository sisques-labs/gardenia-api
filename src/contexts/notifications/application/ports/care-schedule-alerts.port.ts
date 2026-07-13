import { IDueCareSchedule } from '@contexts/notifications/application/ports/due-care-schedule.interface';

export const CARE_SCHEDULE_ALERTS_PORT = Symbol('CARE_SCHEDULE_ALERTS_PORT');

export interface ICareScheduleAlertsPort {
  findDueWithin(windowHours: number): Promise<IDueCareSchedule[]>;
}
