import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export type ICareSchedulePrimitives = BasePrimitives & {
  plantId: string;
  activityType: string;
  intervalDays: number;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  nextDueAt: Date;
  lastCompletedAt: Date | null;
  active: boolean;
  userId: string;
  spaceId: string;
};
