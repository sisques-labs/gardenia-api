import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit/graphql';

import { PlantIdentificationQueryableField } from '@contexts/plant-identification/transport/graphql/enums/plant-identification-queryable-field.enum';

@InputType('PlantIdentificationSortInput')
export class PlantIdentificationSortInput extends createSortInput(
  PlantIdentificationQueryableField,
  'PlantIdentification',
) {}
