import { registerEnumType } from '@nestjs/graphql';

import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

registerEnumType(PlantingSpotTypeEnum, {
  name: 'PlantingSpotTypeEnum',
  description: 'The type of a planting spot',
});

registerEnumType(PlantingSpotStatusEnum, {
  name: 'PlantingSpotStatusEnum',
  description: 'Whether a planting spot is active or resting (fallow)',
});
