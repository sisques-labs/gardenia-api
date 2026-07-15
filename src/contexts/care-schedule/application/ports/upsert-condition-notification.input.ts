import { CareScheduleNotificationTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-notification-type.enum';

export interface UpsertConditionNotificationInput {
  type: CareScheduleNotificationTypeEnum;
  referenceId: string;
  payload: Record<string, unknown>;
  active: boolean;
}
