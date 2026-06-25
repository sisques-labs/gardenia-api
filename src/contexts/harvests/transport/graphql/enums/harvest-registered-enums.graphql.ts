import { registerEnumType } from '@nestjs/graphql';

import { HarvestFilterFieldEnum } from '@contexts/harvests/domain/enums/harvest-filter-field.enum';
import { HarvestSortFieldEnum } from '@contexts/harvests/domain/enums/harvest-sort-field.enum';
import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';

registerEnumType(HarvestUnitEnum, {
  name: 'HarvestUnitEnum',
  description: 'Unit of measurement for a harvest',
});

registerEnumType(HarvestFilterFieldEnum, {
  name: 'HarvestFilterFieldEnum',
  description: 'The harvest fields that can be filtered by',
});

registerEnumType(HarvestSortFieldEnum, {
  name: 'HarvestSortFieldEnum',
  description: 'The harvest fields that can be sorted by',
});
