import { registerEnumType } from '@nestjs/graphql';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';

registerEnumType(HarvestUnitEnum, {
  name: 'HarvestUnitEnum',
  description: 'Unit of measurement for a harvest',
});
