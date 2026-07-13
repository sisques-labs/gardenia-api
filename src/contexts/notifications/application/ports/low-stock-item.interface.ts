export interface ILowStockItem {
  itemId: string;
  name: string;
  itemType: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
}
