import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestUnitValueObject } from './harvest-unit.value-object';

describe('HarvestUnitValueObject', () => {
  it.each(Object.values(HarvestUnitEnum))('accepts valid unit: %s', (unit) => {
    expect(
      () => new HarvestUnitValueObject(unit as HarvestUnitEnum),
    ).not.toThrow();
  });

  it('throws for invalid unit value', () => {
    expect(
      () => new HarvestUnitValueObject('TONS' as HarvestUnitEnum),
    ).toThrow();
  });
});
