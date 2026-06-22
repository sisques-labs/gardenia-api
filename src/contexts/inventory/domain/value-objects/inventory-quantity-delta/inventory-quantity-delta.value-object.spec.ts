import { InventoryQuantityDeltaValueObject } from './inventory-quantity-delta.value-object';

describe('InventoryQuantityDeltaValueObject', () => {
  it('accepts a positive delta (restock)', () => {
    expect(new InventoryQuantityDeltaValueObject(10).value).toBe(10);
  });

  it('accepts a negative delta (consume)', () => {
    expect(() => new InventoryQuantityDeltaValueObject(-5)).not.toThrow();
    expect(new InventoryQuantityDeltaValueObject(-5).value).toBe(-5);
  });

  it('accepts zero', () => {
    expect(new InventoryQuantityDeltaValueObject(0).value).toBe(0);
  });

  it('throws for a non-finite value', () => {
    expect(() => new InventoryQuantityDeltaValueObject(Infinity)).toThrow();
  });
});
