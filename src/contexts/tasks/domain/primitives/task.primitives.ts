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
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
