import { registerEnumType } from '@nestjs/graphql';

import { PlantingSpotFilterFieldEnum } from '@contexts/planting-spots/domain/enums/planting-spot-filter-field.enum';
import { PlantingSpotSortFieldEnum } from '@contexts/planting-spots/domain/enums/planting-spot-sort-field.enum';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

registerEnumType(PlantingSpotTypeEnum, {
  name: 'PlantingSpotTypeEnum',
  description: 'The type of a planting spot',
});

registerEnumType(PlantingSpotFilterFieldEnum, {
  name: 'PlantingSpotFilterFieldEnum',
  description: 'The planting spot fields that can be filtered by',
});

registerEnumType(PlantingSpotSortFieldEnum, {
  name: 'PlantingSpotSortFieldEnum',
  description: 'The planting spot fields that can be sorted by',
});
