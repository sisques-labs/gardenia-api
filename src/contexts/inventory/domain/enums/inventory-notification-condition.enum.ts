/**
 * The two notifiable conditions inventory can report on. Kept local to
 * inventory (not notifications' NotificationTypeEnum) so the port doesn't
 * leak the target context's domain outside infrastructure/adapters.
 */
export enum InventoryNotificationConditionEnum {
  LOW_STOCK = 'LOW_STOCK',
  EXPIRING_SOON = 'EXPIRING_SOON',
}
