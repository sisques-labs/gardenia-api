import { z } from 'zod';

import { RecordNodeCommandAckCommandInput } from '@contexts/nodes/application/commands/record-node-command-ack/record-node-command-ack.command';

/**
 * `commandId` is nullable/optional — `gardenia-bridge` does not emit it yet
 * (pending change), and unlike `bridgeId` this one doesn't block persisting
 * the ack (see proposal.md Out of Scope: correlation gap accepted).
 * `bridgeId` is still required — it's how spaceId gets resolved.
 */
const commandAckMessageSchema = z.object({
  commandId: z.string().nullable().optional(),
  nodeId: z.string().uuid(),
  bridgeId: z.string().uuid(),
  result: z.string(),
  receivedAt: z.string().datetime(),
});

export function parseCommandAckMessage(
  raw: string | null,
): RecordNodeCommandAckCommandInput {
  const parsed = commandAckMessageSchema.parse(JSON.parse(raw ?? ''));

  return {
    commandId: parsed.commandId ?? null,
    nodeId: parsed.nodeId,
    bridgeId: parsed.bridgeId,
    result: parsed.result,
    receivedAt: new Date(parsed.receivedAt),
  };
}
