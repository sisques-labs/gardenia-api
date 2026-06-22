import { InventoryItemIdValueObject } from './inventory-item-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('InventoryItemIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new InventoryItemIdValueObject(VALID_UUID).value).toBe(VALID_UUID);
  });

  it('throws for an invalid UUID', () => {
    expect(() => new InventoryItemIdValueObject('not-a-uuid')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new InventoryItemIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new InventoryItemIdValueObject(VALID_UUID);
    const b = new InventoryItemIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});
