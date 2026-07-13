import { IExpiringItem } from '@contexts/notifications/application/ports/expiring-item.interface';
import { ILowStockItem } from '@contexts/notifications/application/ports/low-stock-item.interface';

export const INVENTORY_ALERTS_PORT = Symbol('INVENTORY_ALERTS_PORT');

export interface IInventoryAlertsPort {
  findLowStock(): Promise<ILowStockItem[]>;
  findExpiringWithin(windowDays: number): Promise<IExpiringItem[]>;
}
