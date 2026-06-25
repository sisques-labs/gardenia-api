import { registerEnumType } from '@nestjs/graphql';

import { PlantSpeciesFilterFieldEnum } from '@contexts/plant-species/domain/enums/plant-species-filter-field.enum';
import { PlantSpeciesSortFieldEnum } from '@contexts/plant-species/domain/enums/plant-species-sort-field.enum';

registerEnumType(PlantSpeciesFilterFieldEnum, {
  name: 'PlantSpeciesFilterFieldEnum',
  description: 'The plant species fields that can be filtered by',
});

registerEnumType(PlantSpeciesSortFieldEnum, {
  name: 'PlantSpeciesSortFieldEnum',
  description: 'The plant species fields that can be sorted by',
});
