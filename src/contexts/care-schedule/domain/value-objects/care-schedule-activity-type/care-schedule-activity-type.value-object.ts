import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';

export class CareScheduleActivityTypeValueObject extends EnumValueObject<
  typeof CareScheduleActivityTypeEnum
> {
  constructor(value: CareScheduleActivityTypeEnum) {
    super(value);
  }

  protected get enumObject(): typeof CareScheduleActivityTypeEnum {
    return CareScheduleActivityTypeEnum as unknown as typeof CareScheduleActivityTypeEnum;
  }
}
