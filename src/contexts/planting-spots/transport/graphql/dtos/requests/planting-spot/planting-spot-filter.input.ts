import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit/graphql';

import { PlantingSpotQueryableField } from '@contexts/planting-spots/transport/graphql/enums/planting-spot-queryable-field.enum';

@InputType('PlantingSpotFilterInput')
export class PlantingSpotFilterInput extends createFilterInput(
  PlantingSpotQueryableField,
  'PlantingSpot',
) {}
