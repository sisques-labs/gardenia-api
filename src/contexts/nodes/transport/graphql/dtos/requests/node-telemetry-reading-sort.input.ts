import { InputType } from '@nestjs/graphql';
import { createSortInput } from '@sisques-labs/nestjs-kit/graphql';

import { NodeTelemetryReadingQueryableField } from '@contexts/nodes/transport/graphql/enums/node-telemetry-reading-queryable-field.enum';

@InputType('NodeTelemetryReadingSortInput')
export class NodeTelemetryReadingSortInput extends createSortInput(
  NodeTelemetryReadingQueryableField,
  'NodeTelemetryReading',
) {}
