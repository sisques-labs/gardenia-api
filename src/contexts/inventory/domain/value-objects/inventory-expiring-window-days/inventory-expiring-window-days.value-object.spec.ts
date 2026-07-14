import { InventoryExpiringWindowDaysValueObject } from './inventory-expiring-window-days.value-object';

describe('InventoryExpiringWindowDaysValueObject', () => {
  it('accepts a positive window', () => {
    expect(new InventoryExpiringWindowDaysValueObject(7).value).toBe(7);
  });

  it('rejects zero', () => {
    expect(() => new InventoryExpiringWindowDaysValueObject(0)).toThrow();
  });

  it('rejects a negative window', () => {
    expect(() => new InventoryExpiringWindowDaysValueObject(-1)).toThrow();
  });
});
