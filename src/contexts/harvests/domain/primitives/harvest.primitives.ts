import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IHarvestPrimitives = BasePrimitives & {
  cropType: string;
  quantity: number;
  unit: string;
  harvestedAt: Date;
  userId: string;
  spaceId: string;
};
