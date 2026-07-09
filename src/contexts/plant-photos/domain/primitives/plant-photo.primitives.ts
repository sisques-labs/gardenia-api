import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPlantPhotoPrimitives = BasePrimitives & {
  plantId: string;
  fileId: string;
  url: string;
  userId: string;
  spaceId: string;
};
