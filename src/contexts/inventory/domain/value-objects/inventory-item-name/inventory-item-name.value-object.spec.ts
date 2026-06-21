import { InventoryItemNameValueObject } from './inventory-item-name.value-object';

describe('InventoryItemNameValueObject', () => {
  it('accepts a non-empty name', () => {
    expect(
      () => new InventoryItemNameValueObject('Lettuce seeds'),
    ).not.toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new InventoryItemNameValueObject('')).toThrow();
  });

  it('throws for whitespace only', () => {
    expect(() => new InventoryItemNameValueObject('   ')).toThrow();
  });
});
