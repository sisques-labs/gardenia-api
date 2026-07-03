import { registerEnumType } from '@nestjs/graphql';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestQueryableField } from '@contexts/harvests/transport/graphql/enums/harvest-queryable-field.enum';

registerEnumType(HarvestUnitEnum, {
  name: 'HarvestUnitEnum',
  description: 'Unit of measurement for a harvest',
});

registerEnumType(HarvestQueryableField, {
  name: 'HarvestQueryableFieldEnum',
  description: 'The harvest fields that can be filtered/sorted on',
});
