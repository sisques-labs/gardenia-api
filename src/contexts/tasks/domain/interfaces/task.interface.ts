import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';
import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskStatusValueObject } from '@contexts/tasks/domain/value-objects/task-status/task-status.value-object';
import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';

export interface ITask {
  id: TaskIdValueObject;
  templateId: TaskTemplateIdValueObject;
  status: TaskStatusValueObject;
  payload: Record<string, unknown>;
  priority: TaskPriorityValueObject;
  delayMs: number | null;
  cronExpression: string | null;
  isRecurring: boolean;
  maxRuns: number | null;
  runCount: number;
  idempotencyKey: string | null;
  queueJobId: string | null;
  userId: UuidValueObject;
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
