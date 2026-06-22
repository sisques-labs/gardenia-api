import { InventoryAcquiredAtValueObject } from './inventory-acquired-at.value-object';

describe('InventoryAcquiredAtValueObject', () => {
  it('wraps a date value', () => {
    const date = new Date('2026-01-15T10:00:00.000Z');

    expect(new InventoryAcquiredAtValueObject(date).value).toBe(date);
  });

  it('supports equality by timestamp', () => {
    const a = new InventoryAcquiredAtValueObject(new Date('2026-01-15'));
    const b = new InventoryAcquiredAtValueObject(new Date('2026-01-15'));

    expect(a.equals(b)).toBe(true);
  });
});
