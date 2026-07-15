import { registerAs } from '@nestjs/config';

export interface IInventoryConfig {
  expiringWindowDays: number;
}

export const inventoryConfig = registerAs(
  'inventory',
  (): IInventoryConfig => ({
    expiringWindowDays: Number(process.env.INVENTORY_EXPIRING_WINDOW_DAYS ?? 7),
  }),
);
