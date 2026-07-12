import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { BridgeStatusEnum } from '@contexts/nodes/domain/enums/bridge-status.enum';
import { BridgeQueryableField } from '@contexts/nodes/transport/graphql/enums/bridge-queryable-field.enum';

export const bridgeFilterableFields: FilterFieldRegistry<BridgeQueryableField> =
  {
    [BridgeQueryableField.ID]: { type: 'uuid' },
    [BridgeQueryableField.NAME]: { type: 'string' },
    [BridgeQueryableField.STATUS]: { type: 'enum', enum: BridgeStatusEnum },
    [BridgeQueryableField.LAST_SEEN_AT]: { type: 'date' },
    [BridgeQueryableField.CREATED_AT]: { type: 'date' },
    [BridgeQueryableField.UPDATED_AT]: { type: 'date' },
  };
