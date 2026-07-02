import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogQueryableField } from '@contexts/care-log/transport/graphql/enums/care-log-queryable-field.enum';

export const careLogFilterableFields: FilterFieldRegistry<CareLogQueryableField> =
  {
    [CareLogQueryableField.ID]: { type: 'uuid' },
    [CareLogQueryableField.PLANT_ID]: { type: 'uuid' },
    [CareLogQueryableField.USER_ID]: { type: 'uuid' },
    [CareLogQueryableField.ACTIVITY_TYPE]: {
      type: 'enum',
      enum: CareLogActivityTypeEnum,
    },
    [CareLogQueryableField.PERFORMED_AT]: { type: 'date' },
    [CareLogQueryableField.NOTES]: { type: 'string' },
    [CareLogQueryableField.QUANTITY]: { type: 'number' },
    [CareLogQueryableField.UNIT]: { type: 'enum', enum: CareLogUnitEnum },
    [CareLogQueryableField.CREATED_AT]: { type: 'date' },
    [CareLogQueryableField.UPDATED_AT]: { type: 'date' },
  };
