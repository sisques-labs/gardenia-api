import { registerEnumType } from '@nestjs/graphql';

import { BridgeStatusEnum } from '@contexts/nodes/domain/enums/bridge-status.enum';
import { NodeStatusEnum } from '@contexts/nodes/domain/enums/node-status.enum';
import { SensorTypeEnum } from '@contexts/nodes/domain/enums/sensor-type.enum';
import { BridgeQueryableField } from '@contexts/nodes/transport/graphql/enums/bridge-queryable-field.enum';
import { NodeQueryableField } from '@contexts/nodes/transport/graphql/enums/node-queryable-field.enum';
import { NodeTelemetryReadingQueryableField } from '@contexts/nodes/transport/graphql/enums/node-telemetry-reading-queryable-field.enum';

registerEnumType(BridgeStatusEnum, {
  name: 'BridgeStatus',
  description: 'Bridge claim lifecycle state',
});

registerEnumType(NodeStatusEnum, {
  name: 'NodeStatus',
  description: 'Node online/offline state',
});

registerEnumType(SensorTypeEnum, {
  name: 'SensorType',
  description: 'Closed catalog of supported sensor types',
});

registerEnumType(BridgeQueryableField, {
  name: 'BridgeQueryableFieldEnum',
  description: 'The bridge fields that can be filtered/sorted on',
});

registerEnumType(NodeQueryableField, {
  name: 'NodeQueryableFieldEnum',
  description: 'The node fields that can be filtered/sorted on',
});

registerEnumType(NodeTelemetryReadingQueryableField, {
  name: 'NodeTelemetryReadingQueryableFieldEnum',
  description:
    'The node telemetry reading fields that can be filtered/sorted on',
});
