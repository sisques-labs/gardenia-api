import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPlantSpeciesPrimitives = BasePrimitives & {
  scientificName: string;
  gbifKey: number | null;
};
