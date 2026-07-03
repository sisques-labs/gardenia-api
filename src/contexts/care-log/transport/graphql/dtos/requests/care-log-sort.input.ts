import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit';

import { CareLogQueryableField } from '@contexts/care-log/transport/graphql/enums/care-log-queryable-field.enum';

@InputType('CareLogSortInput')
export class CareLogSortInput extends createSortInput(
  CareLogQueryableField,
  'CareLog',
) {}
