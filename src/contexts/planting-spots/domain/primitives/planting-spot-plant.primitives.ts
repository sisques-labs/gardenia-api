import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPlantingSpotPlantPrimitives = BasePrimitives & {
  name: string;
  plantSpeciesId: string | null;
  imageUrl: string | null;
  userId: string;
  spaceId: string;
};
