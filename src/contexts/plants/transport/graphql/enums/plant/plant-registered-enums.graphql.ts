import { PlantFilterFieldEnum } from '@contexts/plants/domain/enums/plant-filter-field.enum';
import { PlantSortFieldEnum } from '@contexts/plants/domain/enums/plant-sort-field.enum';
import { registerEnumType } from '@nestjs/graphql';

const registeredPlantEnums = [
  {
    enum: PlantFilterFieldEnum,
    name: 'PlantFilterFieldEnum',
    description: 'The plant fields that can be filtered by',
  },
  {
    enum: PlantSortFieldEnum,
    name: 'PlantSortFieldEnum',
    description: 'The plant fields that can be sorted by',
  },
];

for (const { enum: enumType, name, description } of registeredPlantEnums) {
  registerEnumType(enumType, { name, description });
}
