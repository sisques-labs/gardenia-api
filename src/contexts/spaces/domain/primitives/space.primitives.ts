import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type ISpacePrimitives = BasePrimitives & {
  name: string;
  ownerId: string;
};
