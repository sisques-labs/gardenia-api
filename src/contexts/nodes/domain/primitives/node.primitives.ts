import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type INodePrimitives = BasePrimitives & {
  spaceId: string;
  bridgeId: string;
  name: string | null;
  status: string;
  lastSeenAt: Date | null;
};
