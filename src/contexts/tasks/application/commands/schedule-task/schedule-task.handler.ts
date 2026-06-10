import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { AssertTaskTemplateExistsService } from '@contexts/tasks/application/services/write/assert-task-template-exists/assert-task-template-exists.service';
import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { TaskDuplicateIdempotencyKeyException } from '@contexts/tasks/domain/exceptions/task-duplicate-idempotency-key.exception';
import { TaskTemplateHandlerKeyRequiredException } from '@contexts/tasks/domain/exceptions/task-template-handler-key-required.exception';
import {
  ITaskReadRepository,
  TASK_READ_REPOSITORY,
} from '@contexts/tasks/domain/repositories/read/task-read.repository';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { TaskQueueJobIdValueObject } from '@contexts/tasks/domain/value-objects/task-queue-job-id/task-queue-job-id.value-object';
import {
  ITaskQueueProvider,
  TASK_QUEUE_PROVIDER,
} from '@core/queue/application/ports/task-queue-provider.port';

import { ScheduleTaskCommand } from './schedule-task.command';

@CommandHandler(ScheduleTaskCommand)
export class ScheduleTaskCommandHandler
  extends BaseCommandHandler<ScheduleTaskCommand, TaskAggregate>
  implements ICommandHandler<ScheduleTaskCommand, string>
{
  private readonly logger = new Logger(ScheduleTaskCommandHandler.name);

  constructor(
    @Inject(TASK_WRITE_REPOSITORY)
    private readonly taskWriteRepository: ITaskWriteRepository,
    @Inject(TASK_READ_REPOSITORY)
    private readonly taskReadRepository: ITaskReadRepository,
    @Inject(TASK_QUEUE_PROVIDER)
    private readonly taskQueueProvider: ITaskQueueProvider,
    private readonly taskBuilder: TaskBuilder,
    private readonly assertTaskTemplateExistsService: AssertTaskTemplateExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: ScheduleTaskCommand): Promise<string> {
    const template = await this.assertTaskTemplateExistsService.execute(
      command.templateId.value,
    );
    const primitives = template.toPrimitives();

    if (primitives.handlerKey === null) {
      throw new TaskTemplateHandlerKeyRequiredException(primitives.id);
    }

    if (command.idempotencyKey) {
      const existing = await this.taskReadRepository.findByIdempotencyKey(
        command.idempotencyKey.value,
        [TaskStatusEnum.PENDING, TaskStatusEnum.ACTIVE],
      );
      if (existing) {
        throw new TaskDuplicateIdempotencyKeyException(
          existing.id,
          command.idempotencyKey.value,
        );
      }
    }

    const id = UuidValueObject.generate().value;
    const priority = command.priority?.value ?? primitives.defaultPriority;

    const cronExpression =
      command.cronExpression?.value ?? primitives.defaultCronExpression;
    const isRecurring =
      command.isRecurring?.value ?? primitives.defaultIsRecurring;

    let delayMs = command.delayMs?.value ?? null;
    if (delayMs === null && command.validFrom) {
      delayMs = Math.max(0, command.validFrom.value.getTime() - Date.now());
    }

    const task = this.taskBuilder
      .withId(id)
      .withTemplateId(command.templateId.value)
      .withPayload(command.payload.value)
      .withPriority(priority)
      .withDelayMs(delayMs)
      .withCronExpression(cronExpression)
      .withIsRecurring(isRecurring)
      .withMaxRuns(command.maxRuns?.value ?? null)
      .withIdempotencyKey(command.idempotencyKey?.value ?? null)
      .withUserId(command.userId.value)
      .withTargetType(command.targetType?.value ?? null)
      .withTargetId(command.targetId?.value ?? null)
      .withValidFrom(command.validFrom?.value ?? null)
      .withValidUntil(command.validUntil?.value ?? null)
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();

    task.schedule();
    await this.taskWriteRepository.save(task);

    const queueJobId = await this.taskQueueProvider.enqueue({
      taskId: id,
      handlerKey: primitives.handlerKey,
      payload: command.payload.value,
      priority,
      timeoutMs: primitives.defaultTimeoutMs,
      delayMs: delayMs ?? undefined,
      cronExpression: cronExpression ?? undefined,
      retryCount: primitives.defaultRetryCount,
      backoffStrategy: primitives.defaultBackoffStrategy,
      validUntil: command.validUntil?.value ?? undefined,
    });

    task.setQueueJobId(new TaskQueueJobIdValueObject(queueJobId));
    await this.taskWriteRepository.save(task);
    await this.publishEvents(task);

    this.logger.log(`Task scheduled: ${id} (template: ${primitives.name})`);
    return id;
  }
}
