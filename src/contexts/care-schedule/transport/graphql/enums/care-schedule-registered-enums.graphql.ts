import { registerEnumType } from '@nestjs/graphql';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';

registerEnumType(CareScheduleActivityTypeEnum, {
  name: 'CareScheduleActivityTypeEnum',
  description: 'Type of recurring care activity for a plant',
});

registerEnumType(CareScheduleUnitEnum, {
  name: 'CareScheduleUnitEnum',
  description: 'Unit of measurement for a care schedule dosage',
});
