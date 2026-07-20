import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit/graphql';

import { PlantIdentificationQueryableField } from '@contexts/plant-identification/transport/graphql/enums/plant-identification-queryable-field.enum';

@InputType('PlantIdentificationFilterInput')
export class PlantIdentificationFilterInput extends createFilterInput(
  PlantIdentificationQueryableField,
  'PlantIdentification',
) {}
