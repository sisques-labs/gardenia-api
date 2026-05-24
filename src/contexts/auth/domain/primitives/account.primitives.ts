import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IAccountPrimitives = BasePrimitives & {
  id: string;
  userId: string;
  email: string;
  passwordHash: string;
};
