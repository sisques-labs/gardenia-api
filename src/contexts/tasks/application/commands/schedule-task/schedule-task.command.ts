import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';

export interface ScheduleTaskCommandInput {
  templateId: string;
  payload?: Record<string, unknown>;
  priority?: number;
  delayMs?: number | null;
  cronExpression?: string | null;
  isRecurring?: boolean;
  maxRuns?: number | null;
  idempotencyKey?: string | null;
  userId: string;
  targetType?: string | null;
  targetId?: string | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
}

export class ScheduleTaskCommand {
  public readonly templateId: TaskTemplateIdValueObject;
  public readonly payload: Record<string, unknown>;
  public readonly priority?: TaskPriorityValueObject;
  public readonly delayMs: number | null;
  public readonly cronExpression: string | null;
  public readonly isRecurring: boolean | undefined;
  public readonly maxRuns: number | null;
  public readonly idempotencyKey: string | null;
  public readonly userId: UuidValueObject;
  public readonly targetType: string | null;
  public readonly targetId: string | null;
  public readonly validFrom: Date | null;
  public readonly validUntil: Date | null;

  constructor(input: ScheduleTaskCommandInput) {
    this.templateId = new TaskTemplateIdValueObject(input.templateId);
    this.payload = input.payload ?? {};
    this.priority = input.priority !== undefined ? new TaskPriorityValueObject(input.priority) : undefined;
    this.delayMs = input.delayMs ?? null;
    this.cronExpression = input.cronExpression ?? null;
    this.isRecurring = input.isRecurring;
    this.maxRuns = input.maxRuns ?? null;
    this.idempotencyKey = input.idempotencyKey ?? null;
    this.userId = new UuidValueObject(input.userId);
    this.targetType = input.targetType ?? null;
    this.targetId = input.targetId ?? null;
    this.validFrom = input.validFrom ?? null;
    this.validUntil = input.validUntil ?? null;
  }
}
