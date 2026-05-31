import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPlantPrimitives = BasePrimitives & {
  name: string;
  species: string | null;
  imageUrl: string | null;
  userId: string;
  spaceId: string;
  qrId: string | null;
};
