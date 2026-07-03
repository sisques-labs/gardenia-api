import { registerEnumType } from '@nestjs/graphql';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotQueryableField } from '@contexts/planting-spots/transport/graphql/enums/planting-spot-queryable-field.enum';

registerEnumType(PlantingSpotTypeEnum, {
  name: 'PlantingSpotTypeEnum',
  description: 'The type of a planting spot',
});

registerEnumType(PlantingSpotQueryableField, {
  name: 'PlantingSpotQueryableFieldEnum',
  description: 'The planting spot fields that can be filtered/sorted on',
});
