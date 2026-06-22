import { HarvestHarvestedAtValueObject } from './harvest-harvested-at.value-object';

describe('HarvestHarvestedAtValueObject', () => {
  it('wraps a date value', () => {
    const date = new Date('2026-01-15T10:00:00.000Z');

    expect(new HarvestHarvestedAtValueObject(date).value).toBe(date);
  });

  it('accepts a past date', () => {
    expect(
      () => new HarvestHarvestedAtValueObject(new Date('2000-01-01')),
    ).not.toThrow();
  });

  it('supports equality by timestamp', () => {
    const a = new HarvestHarvestedAtValueObject(new Date('2026-01-15'));
    const b = new HarvestHarvestedAtValueObject(new Date('2026-01-15'));

    expect(a.equals(b)).toBe(true);
  });
});
