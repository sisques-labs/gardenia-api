import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IQrPrimitives = BasePrimitives & {
  plantId: string;
  spaceId: string;
  targetUrl: string;
  generation: number;
};
