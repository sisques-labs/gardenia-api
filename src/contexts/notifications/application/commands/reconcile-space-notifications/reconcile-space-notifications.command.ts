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
  public readonly careScheduleDueWindowHours: number;
  public readonly inventoryExpiringWindowDays: number;

  constructor(input: ReconcileSpaceNotificationsCommandInput) {
    this.careScheduleDueWindowHours = input.careScheduleDueWindowHours;
    this.inventoryExpiringWindowDays = input.inventoryExpiringWindowDays;
  }
}
