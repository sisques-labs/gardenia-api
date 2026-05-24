import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IAccountPrimitives = BasePrimitives & {
  userId: string;
  email: string;
  passwordHash: string;
};
