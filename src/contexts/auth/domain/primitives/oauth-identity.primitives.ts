import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IOAuthIdentityPrimitives = BasePrimitives & {
  userId: string;
  provider: string;
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  accessTokenEnc: string | null;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
};
