import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CareScheduleQueryableField } from '@contexts/care-schedule/transport/graphql/enums/care-schedule-queryable-field.enum';

export const careScheduleFilterableFields: FilterFieldRegistry<CareScheduleQueryableField> =
  {
    [CareScheduleQueryableField.ID]: { type: 'uuid' },
    [CareScheduleQueryableField.PLANT_ID]: { type: 'uuid' },
    [CareScheduleQueryableField.ACTIVITY_TYPE]: {
      type: 'enum',
      enum: CareScheduleActivityTypeEnum,
    },
    [CareScheduleQueryableField.INTERVAL_DAYS]: { type: 'number' },
    [CareScheduleQueryableField.QUANTITY]: { type: 'number' },
    [CareScheduleQueryableField.UNIT]: {
      type: 'enum',
      enum: CareScheduleUnitEnum,
    },
    [CareScheduleQueryableField.NOTES]: { type: 'string' },
    [CareScheduleQueryableField.NEXT_DUE_AT]: { type: 'date' },
    [CareScheduleQueryableField.LAST_COMPLETED_AT]: { type: 'date' },
    [CareScheduleQueryableField.ACTIVE]: { type: 'boolean' },
    [CareScheduleQueryableField.USER_ID]: { type: 'uuid' },
    [CareScheduleQueryableField.CREATED_AT]: { type: 'date' },
    [CareScheduleQueryableField.UPDATED_AT]: { type: 'date' },
    [CareScheduleQueryableField.DUE_BEFORE]: { type: 'date' },
  };
