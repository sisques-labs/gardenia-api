import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit/graphql';

import { NodeQueryableField } from '@contexts/nodes/transport/graphql/enums/node-queryable-field.enum';

@InputType('NodeSortInput')
export class NodeSortInput extends createSortInput(
  NodeQueryableField,
  'Node',
) {}
