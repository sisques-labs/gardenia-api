import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit/graphql';

import { PlantingSpotQueryableField } from '@contexts/planting-spots/transport/graphql/enums/planting-spot-queryable-field.enum';

@InputType('PlantingSpotSortInput')
export class PlantingSpotSortInput extends createSortInput(
  PlantingSpotQueryableField,
  'PlantingSpot',
) {}
