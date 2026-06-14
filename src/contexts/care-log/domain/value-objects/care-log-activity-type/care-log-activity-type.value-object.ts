import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';

export class CareLogActivityTypeValueObject extends EnumValueObject<
  typeof CareLogActivityTypeEnum
> {
  constructor(value: CareLogActivityTypeEnum) {
    super(value);
  }

  protected get enumObject(): typeof CareLogActivityTypeEnum {
    return CareLogActivityTypeEnum as unknown as typeof CareLogActivityTypeEnum;
  }
}
