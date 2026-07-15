import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestQueryableField } from '@contexts/harvests/transport/graphql/enums/harvest-queryable-field.enum';

export const harvestFilterableFields: FilterFieldRegistry<HarvestQueryableField> =
  {
    [HarvestQueryableField.ID]: { type: 'uuid' },
    [HarvestQueryableField.CROP_TYPE]: { type: 'string' },
    [HarvestQueryableField.QUANTITY]: { type: 'number' },
    [HarvestQueryableField.UNIT]: { type: 'enum', enum: HarvestUnitEnum },
    [HarvestQueryableField.HARVESTED_AT]: { type: 'date' },
    [HarvestQueryableField.USER_ID]: { type: 'uuid' },
    [HarvestQueryableField.CREATED_AT]: { type: 'date' },
    [HarvestQueryableField.UPDATED_AT]: { type: 'date' },
  };
