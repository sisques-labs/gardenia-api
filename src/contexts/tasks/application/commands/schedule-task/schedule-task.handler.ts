import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { AssertTaskTemplateExistsService } from '@contexts/tasks/application/services/write/assert-task-template-exists/assert-task-template-exists.service';
import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import { TaskDuplicateIdempotencyKeyException } from '@contexts/tasks/domain/exceptions/task-duplicate-idempotency-key.exception';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import {
  ITaskReadRepository,
  TASK_READ_REPOSITORY,
} from '@contexts/tasks/domain/repositories/read/task-read.repository';
import {
  ITaskWriteRepository,
  TASK_WRITE_REPOSITORY,
} from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import {
  ITaskQueueProvider,
  TASK_QUEUE_PROVIDER,
} from '@core/queue/ports/task-queue-provider.port';

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

    if (command.idempotencyKey) {
      const existing = await this.taskReadRepository.findByIdempotencyKey(
        command.idempotencyKey,
        [TaskStatusEnum.PENDING, TaskStatusEnum.ACTIVE],
      );
      if (existing) {
        throw new TaskDuplicateIdempotencyKeyException(
          existing.id,
          command.idempotencyKey,
        );
      }
    }

    const id = UuidValueObject.generate().value;
    const priority = command.priority?.value ?? primitives.defaultPriority;

    // Fall back to template defaults when cron / recurring not explicitly passed
    const cronExpression = command.cronExpression ?? primitives.defaultCronExpression;
    const isRecurring = command.isRecurring ?? primitives.defaultIsRecurring;

    // Translate validFrom to an initial delay so the job fires at the right time
    let delayMs = command.delayMs;
    if (delayMs === null && command.validFrom) {
      delayMs = Math.max(0, command.validFrom.getTime() - Date.now());
    }

    const task = this.taskBuilder
      .withId(id)
      .withTemplateId(command.templateId.value)
      .withPayload(command.payload)
      .withPriority(priority)
      .withDelayMs(delayMs)
      .withCronExpression(cronExpression)
      .withIsRecurring(isRecurring)
      .withMaxRuns(command.maxRuns)
      .withIdempotencyKey(command.idempotencyKey)
      .withUserId(command.userId.value)
      .withTargetType(command.targetType)
      .withTargetId(command.targetId)
      .withValidFrom(command.validFrom)
      .withValidUntil(command.validUntil)
      .build();

    task.schedule();
    await this.taskWriteRepository.save(task);

    const queueJobId = await this.taskQueueProvider.enqueue({
      taskId: id,
      handlerKey: primitives.handlerKey,
      payload: command.payload,
      priority,
      timeoutMs: primitives.defaultTimeoutMs,
      delayMs: delayMs ?? undefined,
      cronExpression: cronExpression ?? undefined,
      retryCount: primitives.defaultRetryCount,
      backoffStrategy: primitives.defaultBackoffStrategy,
      validUntil: command.validUntil ?? undefined,
    });

    await this.taskWriteRepository.updateQueueJobId(id, queueJobId);
    await this.publishEvents(task);

    this.logger.log(`Task scheduled: ${id} (template: ${primitives.name})`);
    return id;
  }
}
