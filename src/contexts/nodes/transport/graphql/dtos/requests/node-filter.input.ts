import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit/graphql';

import { NodeQueryableField } from '@contexts/nodes/transport/graphql/enums/node-queryable-field.enum';

@InputType('NodeFilterInput')
export class NodeFilterInput extends createFilterInput(
  NodeQueryableField,
  'Node',
) {}
