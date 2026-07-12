import { z } from 'zod';

import { RecordNodeHeartbeatCommandInput } from '@contexts/nodes/application/commands/record-node-heartbeat/record-node-heartbeat.command';

/** `bridgeId` required — same reasoning as the telemetry parser. */
const heartbeatMessageSchema = z.object({
  nodeId: z.string().uuid(),
  bridgeId: z.string().uuid(),
  seenAt: z.string().datetime(),
});

export function parseHeartbeatMessage(
  raw: string | null,
): RecordNodeHeartbeatCommandInput {
  const parsed = heartbeatMessageSchema.parse(JSON.parse(raw ?? ''));

  return {
    nodeId: parsed.nodeId,
    bridgeId: parsed.bridgeId,
    seenAt: new Date(parsed.seenAt),
  };
}
