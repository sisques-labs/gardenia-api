import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';

export class CareLogUnitValueObject extends EnumValueObject<
  typeof CareLogUnitEnum
> {
  constructor(value: CareLogUnitEnum) {
    super(value);
  }

  protected get enumObject(): typeof CareLogUnitEnum {
    return CareLogUnitEnum as unknown as typeof CareLogUnitEnum;
  }
}
