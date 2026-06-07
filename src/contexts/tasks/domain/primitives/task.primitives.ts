import { BasePrimitives } from '@sisques-labs/nestjs-kit';

export interface ITaskPrimitives extends BasePrimitives {
  id: string;
  templateId: string;
  status: string;
  payload: Record<string, unknown>;
  priority: number;
  delayMs: number | null;
  cronExpression: string | null;
  isRecurring: boolean;
  maxRuns: number | null;
  runCount: number;
  idempotencyKey: string | null;
  queueJobId: string | null;
  userId: string;
  targetType: string | null;
  targetId: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
