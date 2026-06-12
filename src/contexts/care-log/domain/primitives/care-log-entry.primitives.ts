import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export interface ICareLogEntryPrimitives extends BasePrimitives {
  plantId: string;
  userId: string;
  spaceId: string;
  activityType: string;
  performedAt: Date;
  notes: string | null;
  quantity: number | null;
  unit: string | null;
}
