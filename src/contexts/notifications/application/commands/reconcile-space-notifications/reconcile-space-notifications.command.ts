import { CareScheduleDueWindowHoursValueObject } from '@contexts/notifications/domain/value-objects/care-schedule-due-window-hours/care-schedule-due-window-hours.value-object';
import { InventoryExpiringWindowDaysValueObject } from '@contexts/notifications/domain/value-objects/inventory-expiring-window-days/inventory-expiring-window-days.value-object';

export type ReconcileSpaceNotificationsCommandInput = {
  careScheduleDueWindowHours: number;
  inventoryExpiringWindowDays: number;
};

/**
 * Internal command — no REST/GraphQL/MCP surface. Dispatched exclusively by
 * NotificationsReconciliationJob, always within a SpaceContext.run() scope
 * (see design.md's reconciliation data flow).
 */
export class ReconcileSpaceNotificationsCommand {
  public readonly careScheduleDueWindowHours: CareScheduleDueWindowHoursValueObject;
  public readonly inventoryExpiringWindowDays: InventoryExpiringWindowDaysValueObject;

  constructor(input: ReconcileSpaceNotificationsCommandInput) {
    this.careScheduleDueWindowHours = new CareScheduleDueWindowHoursValueObject(
      input.careScheduleDueWindowHours,
    );
    this.inventoryExpiringWindowDays =
      new InventoryExpiringWindowDaysValueObject(
        input.inventoryExpiringWindowDays,
      );
  }
}
