import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryItemTypeValueObject } from './inventory-item-type.value-object';

describe('InventoryItemTypeValueObject', () => {
  it('accepts every supported type', () => {
    for (const value of Object.values(InventoryItemTypeEnum)) {
      expect(() => new InventoryItemTypeValueObject(value)).not.toThrow();
    }
  });

  it('throws for the removed POT type', () => {
    expect(
      () => new InventoryItemTypeValueObject('POT' as InventoryItemTypeEnum),
    ).toThrow();
  });

  it('throws for the removed TOOL type', () => {
    expect(
      () => new InventoryItemTypeValueObject('TOOL' as InventoryItemTypeEnum),
    ).toThrow();
  });

  it('throws for an unknown type', () => {
    expect(
      () =>
        new InventoryItemTypeValueObject('VEHICLE' as InventoryItemTypeEnum),
    ).toThrow();
  });
});
