import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type INotificationPrimitives = BasePrimitives & {
  type: string;
  referenceType: string;
  referenceId: string;
  dedupeKey: string;
  payload: Record<string, unknown>;
  status: string;
  readAt: Date | null;
  resolvedAt: Date | null;
  userId: string;
  spaceId: string;
};
