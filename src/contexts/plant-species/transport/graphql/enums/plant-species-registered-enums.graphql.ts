import { registerEnumType } from '@nestjs/graphql';

import { PlantSpeciesQueryableField } from '@contexts/plant-species/transport/graphql/enums/plant-species-queryable-field.enum';

const registeredPlantSpeciesEnums = [
  {
    enum: PlantSpeciesQueryableField,
    name: 'PlantSpeciesQueryableFieldEnum',
    description: 'The plant species fields that can be filtered/sorted on',
  },
];

for (const {
  enum: enumType,
  name,
  description,
} of registeredPlantSpeciesEnums) {
  registerEnumType(enumType, { name, description });
}
