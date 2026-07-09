import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit/graphql';

import { HarvestQueryableField } from '@contexts/harvests/transport/graphql/enums/harvest-queryable-field.enum';

@InputType('HarvestSortInput')
export class HarvestSortInput extends createSortInput(
  HarvestQueryableField,
  'Harvest',
) {}
