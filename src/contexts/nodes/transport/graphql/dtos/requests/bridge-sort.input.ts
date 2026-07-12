import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit/graphql';

import { BridgeQueryableField } from '@contexts/nodes/transport/graphql/enums/bridge-queryable-field.enum';

@InputType('BridgeSortInput')
export class BridgeSortInput extends createSortInput(
  BridgeQueryableField,
  'Bridge',
) {}
