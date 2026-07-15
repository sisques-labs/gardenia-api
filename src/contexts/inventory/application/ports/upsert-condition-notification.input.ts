import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';

export interface UpsertConditionNotificationInput {
  condition: InventoryNotificationConditionEnum;
  referenceId: string;
  payload: Record<string, unknown>;
  active: boolean;
}
