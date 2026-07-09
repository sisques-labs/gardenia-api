import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit/graphql';

import { HarvestQueryableField } from '@contexts/harvests/transport/graphql/enums/harvest-queryable-field.enum';

@InputType('HarvestFilterInput')
export class HarvestFilterInput extends createFilterInput(
  HarvestQueryableField,
  'Harvest',
) {}
