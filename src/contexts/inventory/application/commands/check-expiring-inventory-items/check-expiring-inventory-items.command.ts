import { InventoryExpiringWindowDaysValueObject } from '@contexts/inventory/domain/value-objects/inventory-expiring-window-days/inventory-expiring-window-days.value-object';

export type CheckExpiringInventoryItemsCommandInput = {
  windowDays: number;
};

/**
 * Internal command — no REST/GraphQL/MCP surface. Dispatched exclusively by
 * InventoryExpiringReconciliationJob, always within a SpaceContext.run()
 * scope. Detects newly-expiring items and tells notifications about them;
 * resolving an item that's no longer expiring happens event-driven, in
 * update/delete-inventory-item handlers — see design.md. Low-stock is fully
 * event-driven both ways (see adjust/update-inventory-item handlers) and has
 * no equivalent cron.
 */
export class CheckExpiringInventoryItemsCommand {
  public readonly windowDays: InventoryExpiringWindowDaysValueObject;

  constructor(input: CheckExpiringInventoryItemsCommandInput) {
    this.windowDays = new InventoryExpiringWindowDaysValueObject(
      input.windowDays,
    );
  }
}
