import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IQrPrimitives = BasePrimitives & {
  spaceId: string;
  targetUrl: string;
  generation: number;
  expiresAt: Date | null;
};
