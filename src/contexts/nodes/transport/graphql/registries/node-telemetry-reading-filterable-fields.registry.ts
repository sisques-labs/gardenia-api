import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { SensorTypeEnum } from '@contexts/nodes/domain/enums/sensor-type.enum';
import { NodeTelemetryReadingQueryableField } from '@contexts/nodes/transport/graphql/enums/node-telemetry-reading-queryable-field.enum';

export const nodeTelemetryReadingFilterableFields: FilterFieldRegistry<NodeTelemetryReadingQueryableField> =
  {
    [NodeTelemetryReadingQueryableField.ID]: { type: 'uuid' },
    [NodeTelemetryReadingQueryableField.NODE_ID]: { type: 'uuid' },
    [NodeTelemetryReadingQueryableField.SENSOR_TYPE]: {
      type: 'enum',
      enum: SensorTypeEnum,
    },
    [NodeTelemetryReadingQueryableField.VALUE]: { type: 'number' },
    [NodeTelemetryReadingQueryableField.UNIT]: { type: 'string' },
    [NodeTelemetryReadingQueryableField.RECORDED_AT]: { type: 'date' },
  };
