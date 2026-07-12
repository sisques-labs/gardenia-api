import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { NodeStatusEnum } from '@contexts/nodes/domain/enums/node-status.enum';
import { NodeQueryableField } from '@contexts/nodes/transport/graphql/enums/node-queryable-field.enum';

export const nodeFilterableFields: FilterFieldRegistry<NodeQueryableField> = {
  [NodeQueryableField.ID]: { type: 'uuid' },
  [NodeQueryableField.BRIDGE_ID]: { type: 'uuid' },
  [NodeQueryableField.NAME]: { type: 'string' },
  [NodeQueryableField.STATUS]: { type: 'enum', enum: NodeStatusEnum },
  [NodeQueryableField.LAST_SEEN_AT]: { type: 'date' },
  [NodeQueryableField.CREATED_AT]: { type: 'date' },
  [NodeQueryableField.UPDATED_AT]: { type: 'date' },
};
