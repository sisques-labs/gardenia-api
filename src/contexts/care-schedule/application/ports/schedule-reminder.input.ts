export interface ScheduleReminderInput {
  careScheduleId: string;
  userId: string;
  plantId: string;
  activityType: string;
  dueAt: Date;
}
