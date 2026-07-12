import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit/graphql';

import { BridgeQueryableField } from '@contexts/nodes/transport/graphql/enums/bridge-queryable-field.enum';

@InputType('BridgeFilterInput')
export class BridgeFilterInput extends createFilterInput(
  BridgeQueryableField,
  'Bridge',
) {}
