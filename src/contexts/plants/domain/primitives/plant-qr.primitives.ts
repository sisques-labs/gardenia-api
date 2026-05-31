import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPlantQrPrimitives = BasePrimitives & {
  spaceId: string;
  targetUrl: string;
  generation: number;
  image: string;
};
