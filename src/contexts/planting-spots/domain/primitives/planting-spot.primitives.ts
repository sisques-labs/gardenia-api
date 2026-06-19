import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPlantingSpotPrimitives = BasePrimitives & {
  name: string;
  type: string;
  description: string | null;
  capacity: number | null;
  row: number | null;
  column: number | null;
  dimensions: string | null;
  soilType: string | null;
  userId: string;
  spaceId: string;
};
