import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogUnitValueObject } from './care-log-unit.value-object';

describe('CareLogUnitValueObject', () => {
  it('accepts every valid enum value', () => {
    for (const value of Object.values(CareLogUnitEnum)) {
      expect(() => new CareLogUnitValueObject(value)).not.toThrow();
      expect(new CareLogUnitValueObject(value).value).toBe(value);
    }
  });

  it('throws for an invalid value', () => {
    expect(() => new CareLogUnitValueObject('OZ' as CareLogUnitEnum)).toThrow();
  });

  it('throws for an empty value', () => {
    expect(() => new CareLogUnitValueObject('' as CareLogUnitEnum)).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new CareLogUnitValueObject(CareLogUnitEnum.ML);
    const b = new CareLogUnitValueObject(CareLogUnitEnum.ML);

    expect(a.equals(b)).toBe(true);
  });
});
