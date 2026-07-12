import { z } from 'zod';

import { RecordTelemetryReadingCommandInput } from '@contexts/nodes/application/commands/record-telemetry-reading/record-telemetry-reading.command';
import { SensorTypeEnum } from '@contexts/nodes/domain/enums/sensor-type.enum';

/**
 * `bridgeId` is REQUIRED — it's how spaceId gets resolved (see
 * `FindOrCreateNodeService`). `gardenia-bridge` does not emit this field
 * yet (pending change, tracked in the architecture vision doc), so every
 * telemetry message will fail to parse — and be logged + dropped, not
 * crash the consumer — until that ships. This is expected, not a bug.
 */
const telemetryMessageSchema = z.object({
  nodeId: z.string().uuid(),
  bridgeId: z.string().uuid(),
  sensorType: z.nativeEnum(SensorTypeEnum),
  value: z.number(),
  unit: z.string().nullable().optional(),
  recordedAt: z.string().datetime(),
});

export function parseTelemetryMessage(
  raw: string | null,
): RecordTelemetryReadingCommandInput {
  const parsed = telemetryMessageSchema.parse(JSON.parse(raw ?? ''));

  return {
    nodeId: parsed.nodeId,
    bridgeId: parsed.bridgeId,
    sensorType: parsed.sensorType,
    value: parsed.value,
    unit: parsed.unit ?? null,
    recordedAt: new Date(parsed.recordedAt),
  };
}
