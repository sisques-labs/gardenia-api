import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPlantPrimitives = BasePrimitives & {
  name: string;
  plantSpeciesId: string | null;
  imageUrl: string | null;
  userId: string;
  spaceId: string;
  qrId: string | null;
};
