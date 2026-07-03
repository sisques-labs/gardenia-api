import { registerEnumType } from '@nestjs/graphql';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogQueryableField } from '@contexts/care-log/transport/graphql/enums/care-log-queryable-field.enum';

registerEnumType(CareLogActivityTypeEnum, {
  name: 'CareLogActivityType',
  description: 'Type of care activity performed on a plant',
});

registerEnumType(CareLogUnitEnum, {
  name: 'CareLogUnit',
  description: 'Unit of measurement for care log quantity',
});

registerEnumType(CareLogQueryableField, {
  name: 'CareLogQueryableFieldEnum',
  description: 'The care log fields that can be filtered/sorted on',
});
