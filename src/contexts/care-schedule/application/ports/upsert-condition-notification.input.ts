export interface UpsertConditionNotificationInput {
  referenceId: string;
  payload: Record<string, unknown>;
  active: boolean;
}
