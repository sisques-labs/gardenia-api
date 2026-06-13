import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';

export class HarvestUnitValueObject extends EnumValueObject<
  typeof HarvestUnitEnum
> {
  constructor(value: HarvestUnitEnum) {
    super(value);
  }

  protected get enumObject(): typeof HarvestUnitEnum {
    return HarvestUnitEnum as unknown as typeof HarvestUnitEnum;
  }
}
