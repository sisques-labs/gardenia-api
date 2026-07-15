import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit/graphql';

import { CareLogQueryableField } from '@contexts/care-log/transport/graphql/enums/care-log-queryable-field.enum';

@InputType('CareLogFilterInput')
export class CareLogFilterInput extends createFilterInput(
  CareLogQueryableField,
  'CareLog',
) {}
