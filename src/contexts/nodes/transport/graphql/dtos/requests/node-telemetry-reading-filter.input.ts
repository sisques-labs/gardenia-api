import { InputType } from '@nestjs/graphql';
import { createFilterInput } from '@sisques-labs/nestjs-kit/graphql';

import { NodeTelemetryReadingQueryableField } from '@contexts/nodes/transport/graphql/enums/node-telemetry-reading-queryable-field.enum';

@InputType('NodeTelemetryReadingFilterInput')
export class NodeTelemetryReadingFilterInput extends createFilterInput(
  NodeTelemetryReadingQueryableField,
  'NodeTelemetryReading',
) {}
