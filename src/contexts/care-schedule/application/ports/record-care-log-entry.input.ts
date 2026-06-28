export interface RecordCareLogEntryInput {
  plantId: string;
  userId: string;
  spaceId: string;
  activityType: string;
  performedAt: Date;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
}
