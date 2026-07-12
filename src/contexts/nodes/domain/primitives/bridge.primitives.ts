import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IBridgePrimitives = BasePrimitives & {
  spaceId: string | null;
  name: string | null;
  status: string;
  pairingCode: string | null;
  lastSeenAt: Date | null;
};
