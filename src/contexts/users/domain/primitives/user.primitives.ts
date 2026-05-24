import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IUserPrimitives = BasePrimitives & {
  status: string;
};
