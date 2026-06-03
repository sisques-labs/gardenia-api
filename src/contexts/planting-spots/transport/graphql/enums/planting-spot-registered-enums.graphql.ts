import { registerEnumType } from '@nestjs/graphql';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

registerEnumType(PlantingSpotTypeEnum, {
  name: 'PlantingSpotTypeEnum',
  description: 'The type of a planting spot',
});
