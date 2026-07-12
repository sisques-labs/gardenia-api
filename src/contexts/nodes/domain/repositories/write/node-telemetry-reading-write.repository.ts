import { NodeTelemetryReading } from '@contexts/nodes/domain/records/node-telemetry-reading.record';

export const NODE_TELEMETRY_READING_WRITE_REPOSITORY = Symbol(
  'NODE_TELEMETRY_READING_WRITE_REPOSITORY',
);

/**
 * Deliberately narrower than {@link IBaseWriteRepository} — a telemetry
 * reading is insert-only, never updated or individually deleted through the
 * application layer. See design.md §3.4.
 */
export interface INodeTelemetryReadingWriteRepository {
  insert(reading: NodeTelemetryReading): Promise<void>;
}
