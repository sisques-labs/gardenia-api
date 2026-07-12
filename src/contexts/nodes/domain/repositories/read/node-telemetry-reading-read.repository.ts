import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

import { NodeTelemetryReadingViewModel } from '@contexts/nodes/domain/view-models/node-telemetry-reading.view-model';

export const NODE_TELEMETRY_READING_READ_REPOSITORY = Symbol(
  'NODE_TELEMETRY_READING_READ_REPOSITORY',
);

export type INodeTelemetryReadingReadRepository =
  IBaseReadRepository<NodeTelemetryReadingViewModel>;
