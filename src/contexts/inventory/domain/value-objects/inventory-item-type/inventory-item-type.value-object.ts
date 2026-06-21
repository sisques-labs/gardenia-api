import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';

export class InventoryItemTypeValueObject extends EnumValueObject<
  typeof InventoryItemTypeEnum
> {
  constructor(value: InventoryItemTypeEnum) {
    super(value);
  }

  protected get enumObject(): typeof InventoryItemTypeEnum {
    return InventoryItemTypeEnum as unknown as typeof InventoryItemTypeEnum;
  }
}
