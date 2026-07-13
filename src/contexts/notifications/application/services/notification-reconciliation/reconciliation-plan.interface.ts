import { NotificationReferenceTypeEnum } from '@contexts/notifications/domain/enums/notification-reference-type.enum';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';

export interface IReconciliationCreatePlanEntry {
  dedupeKey: string;
  type: NotificationTypeEnum;
  referenceType: NotificationReferenceTypeEnum;
  referenceId: string;
  payload: Record<string, unknown>;
}

export interface IReconciliationPlan {
  toCreate: IReconciliationCreatePlanEntry[];
  toResolveDedupeKeys: string[];
}
