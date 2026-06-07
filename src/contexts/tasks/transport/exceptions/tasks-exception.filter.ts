import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { TaskDuplicateIdempotencyKeyException } from '@contexts/tasks/domain/exceptions/task-duplicate-idempotency-key.exception';
import { TaskHandlerNotFoundException } from '@contexts/tasks/domain/exceptions/task-handler-not-found.exception';
import { TaskNotCancellableException } from '@contexts/tasks/domain/exceptions/task-not-cancellable.exception';
import { TaskNotFoundException } from '@contexts/tasks/domain/exceptions/task-not-found.exception';
import { TaskTemplateNotFoundException } from '@contexts/tasks/domain/exceptions/task-template-not-found.exception';

export function resolveTasksExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof TaskNotFoundException) return HttpStatus.NOT_FOUND;
  if (exception instanceof TaskTemplateNotFoundException) return HttpStatus.NOT_FOUND;
  if (exception instanceof TaskNotCancellableException) return HttpStatus.CONFLICT;
  if (exception instanceof TaskDuplicateIdempotencyKeyException) return HttpStatus.CONFLICT;
  if (exception instanceof TaskHandlerNotFoundException) return HttpStatus.INTERNAL_SERVER_ERROR;
  return null;
}
