import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IInventoryItemPrimitives = BasePrimitives & {
  itemType: string;
  name: string;
  brand: string | null;
  notes: string | null;
  quantity: number;
  unit: string;
  lowStockThreshold: number | null;
  acquiredAt: Date | null;
  expiresAt: Date | null;
  userId: string;
  spaceId: string;
};
