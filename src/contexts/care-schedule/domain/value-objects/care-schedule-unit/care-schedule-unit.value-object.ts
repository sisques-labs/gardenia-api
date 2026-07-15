import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';

export class CareScheduleUnitValueObject extends EnumValueObject<
  typeof CareScheduleUnitEnum
> {
  constructor(value: CareScheduleUnitEnum) {
    super(value);
  }

  protected get enumObject(): typeof CareScheduleUnitEnum {
    return CareScheduleUnitEnum as unknown as typeof CareScheduleUnitEnum;
  }
}
