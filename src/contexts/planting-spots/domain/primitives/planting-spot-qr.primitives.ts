import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPlantingSpotQrPrimitives = BasePrimitives & {
  spaceId: string;
  targetUrl: string;
  generation: number;
  image: string;
};
