import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';

export class InventoryUnitValueObject extends EnumValueObject<
  typeof InventoryUnitEnum
> {
  constructor(value: InventoryUnitEnum) {
    super(value);
  }

  protected get enumObject(): typeof InventoryUnitEnum {
    return InventoryUnitEnum as unknown as typeof InventoryUnitEnum;
  }
}
