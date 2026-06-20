import { InventoryLowStockThresholdValueObject } from './inventory-low-stock-threshold.value-object';

describe('InventoryLowStockThresholdValueObject', () => {
  it('accepts zero and positive values', () => {
    expect(() => new InventoryLowStockThresholdValueObject(0)).not.toThrow();
    expect(() => new InventoryLowStockThresholdValueObject(3)).not.toThrow();
  });

  it('throws for a negative value', () => {
    expect(() => new InventoryLowStockThresholdValueObject(-1)).toThrow();
  });
});
