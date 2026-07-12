import { z } from 'zod';

/** Input schema for the `bridge_claim` MCP tool. */
export const bridgeClaimSchema = {
  bridgeId: z.string().uuid().describe('Id of the bridge to claim'),
  pairingCode: z.string().describe('Pairing code shown by the bridge'),
};
