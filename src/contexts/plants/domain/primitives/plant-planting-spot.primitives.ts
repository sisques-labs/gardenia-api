import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPlantPlantingSpotPrimitives = BasePrimitives & {
  name: string;
  type: string;
  description: string | null;
  userId: string;
  spaceId: string;
};
