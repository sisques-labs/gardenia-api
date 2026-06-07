import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { ITaskPrimitives } from '@contexts/tasks/domain/primitives/task.primitives';

export class TaskViewModel extends BaseViewModel {
  public readonly templateId: string;
  public readonly status: string;
  public readonly payload: Record<string, unknown>;
  public readonly priority: number;
  public readonly delayMs: number | null;
  public readonly cronExpression: string | null;
  public readonly isRecurring: boolean;
  public readonly maxRuns: number | null;
  public readonly runCount: number;
  public readonly idempotencyKey: string | null;
  public readonly queueJobId: string | null;
  public readonly userId: string;
  public readonly scheduledAt: Date | null;
  public readonly startedAt: Date | null;
  public readonly completedAt: Date | null;
  public readonly failedAt: Date | null;
  public readonly cancelledAt: Date | null;

  constructor(props: ITaskPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.templateId = props.templateId;
    this.status = props.status;
    this.payload = props.payload;
    this.priority = props.priority;
    this.delayMs = props.delayMs;
    this.cronExpression = props.cronExpression;
    this.isRecurring = props.isRecurring;
    this.maxRuns = props.maxRuns;
    this.runCount = props.runCount;
    this.idempotencyKey = props.idempotencyKey;
    this.queueJobId = props.queueJobId;
    this.userId = props.userId;
    this.scheduledAt = props.scheduledAt;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
    this.failedAt = props.failedAt;
    this.cancelledAt = props.cancelledAt;
  }
}
