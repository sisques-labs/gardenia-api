import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPlantSpeciesPrimitives = BasePrimitives & {
  scientificName: string;
  description: string | null;
  imageUrl: string | null;
};
