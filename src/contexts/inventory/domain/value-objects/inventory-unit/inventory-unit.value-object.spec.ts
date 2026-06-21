import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryUnitValueObject } from './inventory-unit.value-object';

describe('InventoryUnitValueObject', () => {
  it('accepts every supported unit', () => {
    for (const value of Object.values(InventoryUnitEnum)) {
      expect(() => new InventoryUnitValueObject(value)).not.toThrow();
    }
  });

  it('throws for an invalid unit', () => {
    expect(
      () => new InventoryUnitValueObject('TONS' as InventoryUnitEnum),
    ).toThrow();
  });
});
