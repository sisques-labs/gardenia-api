import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type IPushSubscriptionPrimitives = BasePrimitives & {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
};
