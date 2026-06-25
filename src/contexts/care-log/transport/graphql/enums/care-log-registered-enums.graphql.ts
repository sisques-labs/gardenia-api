import { registerEnumType } from '@nestjs/graphql';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogFilterFieldEnum } from '@contexts/care-log/domain/enums/care-log-filter-field.enum';
import { CareLogSortFieldEnum } from '@contexts/care-log/domain/enums/care-log-sort-field.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';

registerEnumType(CareLogActivityTypeEnum, {
  name: 'CareLogActivityType',
  description: 'Type of care activity performed on a plant',
});

registerEnumType(CareLogUnitEnum, {
  name: 'CareLogUnit',
  description: 'Unit of measurement for care log quantity',
});

registerEnumType(CareLogFilterFieldEnum, {
  name: 'CareLogFilterFieldEnum',
  description: 'The care log fields that can be filtered by',
});

registerEnumType(CareLogSortFieldEnum, {
  name: 'CareLogSortFieldEnum',
  description: 'The care log fields that can be sorted by',
});
