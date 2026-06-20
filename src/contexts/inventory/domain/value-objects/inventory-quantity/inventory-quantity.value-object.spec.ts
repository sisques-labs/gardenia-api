import { InventoryQuantityValueObject } from './inventory-quantity.value-object';

describe('InventoryQuantityValueObject', () => {
  it('accepts zero', () => {
    expect(() => new InventoryQuantityValueObject(0)).not.toThrow();
    expect(new InventoryQuantityValueObject(0).value).toBe(0);
  });

  it('accepts a positive decimal', () => {
    expect(() => new InventoryQuantityValueObject(2.5)).not.toThrow();
  });

  it('throws for a negative value', () => {
    expect(() => new InventoryQuantityValueObject(-1)).toThrow();
  });
});
