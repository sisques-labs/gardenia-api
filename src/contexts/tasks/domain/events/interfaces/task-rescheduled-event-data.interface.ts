export interface ITaskRescheduledEventData {
  id: string;
  userId: string;
  oldScheduledAt: Date | null;
  newScheduledAt: Date;
}
