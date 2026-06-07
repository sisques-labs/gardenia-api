import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskCronExpressionValueObject } from '@contexts/tasks/domain/value-objects/task-cron-expression/task-cron-expression.value-object';
import { TaskDelayMsValueObject } from '@contexts/tasks/domain/value-objects/task-delay-ms/task-delay-ms.value-object';
import { TaskIdempotencyKeyValueObject } from '@contexts/tasks/domain/value-objects/task-idempotency-key/task-idempotency-key.value-object';
import { TaskIsRecurringValueObject } from '@contexts/tasks/domain/value-objects/task-is-recurring/task-is-recurring.value-object';
import { TaskMaxRunsValueObject } from '@contexts/tasks/domain/value-objects/task-max-runs/task-max-runs.value-object';
import { TaskPayloadValueObject } from '@contexts/tasks/domain/value-objects/task-payload/task-payload.value-object';
import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskTargetIdValueObject } from '@contexts/tasks/domain/value-objects/task-target-id/task-target-id.value-object';
import { TaskTargetTypeValueObject } from '@contexts/tasks/domain/value-objects/task-target-type/task-target-type.value-object';
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
  public readonly payload: TaskPayloadValueObject;
  public readonly priority?: TaskPriorityValueObject;
  public readonly delayMs: TaskDelayMsValueObject | null;
  public readonly cronExpression: TaskCronExpressionValueObject | null;
  public readonly isRecurring: TaskIsRecurringValueObject | undefined;
  public readonly maxRuns: TaskMaxRunsValueObject | null;
  public readonly idempotencyKey: TaskIdempotencyKeyValueObject | null;
  public readonly userId: UuidValueObject;
  public readonly targetType: TaskTargetTypeValueObject | null;
  public readonly targetId: TaskTargetIdValueObject | null;
  public readonly validFrom: DateValueObject | null;
  public readonly validUntil: DateValueObject | null;

  constructor(input: ScheduleTaskCommandInput) {
    this.templateId = new TaskTemplateIdValueObject(input.templateId);
    this.payload = new TaskPayloadValueObject(input.payload ?? {});
    this.priority =
      input.priority !== undefined
        ? new TaskPriorityValueObject(input.priority)
        : undefined;
    this.delayMs =
      input.delayMs != null ? new TaskDelayMsValueObject(input.delayMs) : null;
    this.cronExpression = input.cronExpression
      ? new TaskCronExpressionValueObject(input.cronExpression)
      : null;
    this.isRecurring =
      input.isRecurring !== undefined
        ? new TaskIsRecurringValueObject(input.isRecurring)
        : undefined;
    this.maxRuns =
      input.maxRuns != null ? new TaskMaxRunsValueObject(input.maxRuns) : null;
    this.idempotencyKey = input.idempotencyKey
      ? new TaskIdempotencyKeyValueObject(input.idempotencyKey)
      : null;
    this.userId = new UuidValueObject(input.userId);
    this.targetType = input.targetType
      ? new TaskTargetTypeValueObject(input.targetType)
      : null;
    this.targetId = input.targetId
      ? new TaskTargetIdValueObject(input.targetId)
      : null;
    this.validFrom = input.validFrom
      ? new DateValueObject(input.validFrom)
      : null;
    this.validUntil = input.validUntil
      ? new DateValueObject(input.validUntil)
      : null;
  }
}
