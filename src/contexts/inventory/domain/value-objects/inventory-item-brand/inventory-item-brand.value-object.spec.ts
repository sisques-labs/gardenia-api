import { InventoryItemBrandValueObject } from './inventory-item-brand.value-object';

describe('InventoryItemBrandValueObject', () => {
  it('wraps a non-empty brand', () => {
    expect(new InventoryItemBrandValueObject('Compo').value).toBe('Compo');
  });

  it('throws for an empty string', () => {
    expect(() => new InventoryItemBrandValueObject('')).toThrow();
  });

  it('accepts a brand of exactly MAX_LENGTH chars', () => {
    const brand = 'a'.repeat(InventoryItemBrandValueObject.MAX_LENGTH);

    expect(() => new InventoryItemBrandValueObject(brand)).not.toThrow();
  });

  it('throws for a brand longer than MAX_LENGTH', () => {
    const brand = 'a'.repeat(InventoryItemBrandValueObject.MAX_LENGTH + 1);

    expect(() => new InventoryItemBrandValueObject(brand)).toThrow();
  });
});
