import { registerEnumType } from '@nestjs/graphql';

import { PlantQueryableField } from '@contexts/plants/transport/graphql/enums/plant/plant-queryable-field.enum';

const registeredPlantEnums = [
  {
    enum: PlantQueryableField,
    name: 'PlantQueryableFieldEnum',
    description: 'The plant fields that can be filtered/sorted on',
  },
];

for (const { enum: enumType, name, description } of registeredPlantEnums) {
  registerEnumType(enumType, { name, description });
}
