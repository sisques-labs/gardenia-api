import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IUserPrimitives = BasePrimitives & {
  status: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locale: string | null;
  timezone: string | null;
};
