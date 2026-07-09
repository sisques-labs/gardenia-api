import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPlantingSpotPrimitives = BasePrimitives & {
  name: string;
  type: string;
  description: string | null;
  capacity: number | null;
  row: number | null;
  column: number | null;
  dimensionsWidth: number | null;
  dimensionsHeight: number | null;
  dimensionsLength: number | null;
  soilType: string | null;
  status: string;
  fallowSince: Date | null;
  qrId: string | null;
  userId: string;
  spaceId: string;
};
