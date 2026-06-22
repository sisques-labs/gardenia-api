import { InventoryExpiresAtValueObject } from './inventory-expires-at.value-object';

describe('InventoryExpiresAtValueObject', () => {
  it('wraps a date value', () => {
    const date = new Date('2027-01-15T10:00:00.000Z');

    expect(new InventoryExpiresAtValueObject(date).value).toBe(date);
  });

  it('supports equality by timestamp', () => {
    const a = new InventoryExpiresAtValueObject(new Date('2027-01-15'));
    const b = new InventoryExpiresAtValueObject(new Date('2027-01-15'));

    expect(a.equals(b)).toBe(true);
  });
});
