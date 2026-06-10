import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskCronExpressionValueObject } from '@contexts/tasks/domain/value-objects/task-cron-expression/task-cron-expression.value-object';
import { TaskDelayMsValueObject } from '@contexts/tasks/domain/value-objects/task-delay-ms/task-delay-ms.value-object';
import { TaskDescriptionValueObject } from '@contexts/tasks/domain/value-objects/task-description/task-description.value-object';
import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';
import { TaskIdempotencyKeyValueObject } from '@contexts/tasks/domain/value-objects/task-idempotency-key/task-idempotency-key.value-object';
import { TaskIsRecurringValueObject } from '@contexts/tasks/domain/value-objects/task-is-recurring/task-is-recurring.value-object';
import { TaskMaxRunsValueObject } from '@contexts/tasks/domain/value-objects/task-max-runs/task-max-runs.value-object';
import { TaskNameValueObject } from '@contexts/tasks/domain/value-objects/task-name/task-name.value-object';
import { TaskPayloadValueObject } from '@contexts/tasks/domain/value-objects/task-payload/task-payload.value-object';
import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskQueueJobIdValueObject } from '@contexts/tasks/domain/value-objects/task-queue-job-id/task-queue-job-id.value-object';
import { TaskRunCountValueObject } from '@contexts/tasks/domain/value-objects/task-run-count/task-run-count.value-object';
import { TaskStatusValueObject } from '@contexts/tasks/domain/value-objects/task-status/task-status.value-object';
import { TaskTargetIdValueObject } from '@contexts/tasks/domain/value-objects/task-target-id/task-target-id.value-object';
import { TaskTargetTypeValueObject } from '@contexts/tasks/domain/value-objects/task-target-type/task-target-type.value-object';
import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';
import { TaskTriggerTypeValueObject } from '@contexts/tasks/domain/value-objects/task-trigger-type/task-trigger-type.value-object';

export interface ITask {
  id: TaskIdValueObject;
  templateId: TaskTemplateIdValueObject | null;
  triggerType: TaskTriggerTypeValueObject;
  title: TaskNameValueObject | null;
  description: TaskDescriptionValueObject | null;
  status: TaskStatusValueObject;
  payload: TaskPayloadValueObject;
  priority: TaskPriorityValueObject;
  delayMs: TaskDelayMsValueObject | null;
  cronExpression: TaskCronExpressionValueObject | null;
  isRecurring: TaskIsRecurringValueObject;
  maxRuns: TaskMaxRunsValueObject | null;
  runCount: TaskRunCountValueObject;
  idempotencyKey: TaskIdempotencyKeyValueObject | null;
  queueJobId: TaskQueueJobIdValueObject | null;
  userId: UuidValueObject;
  targetType: TaskTargetTypeValueObject | null;
  targetId: TaskTargetIdValueObject | null;
  validFrom: DateValueObject | null;
  validUntil: DateValueObject | null;
  scheduledAt: DateValueObject | null;
  startedAt: DateValueObject | null;
  completedAt: DateValueObject | null;
  failedAt: DateValueObject | null;
  cancelledAt: DateValueObject | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
