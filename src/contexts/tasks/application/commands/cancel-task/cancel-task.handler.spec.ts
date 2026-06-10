import { EventBus } from '@nestjs/cqrs';

import { AssertTaskCancellableService } from '@contexts/tasks/application/services/write/assert-task-cancellable/assert-task-cancellable.service';
import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { TaskNotCancellableException } from '@contexts/tasks/domain/exceptions/task-not-cancellable.exception';
import { ITaskWriteRepository } from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { ITaskQueueProvider } from '@core/queue/application/ports/task-queue-provider.port';

import { CancelTaskCommand } from './cancel-task.command';
import { CancelTaskCommandHandler } from './cancel-task.handler';

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440002';
const USER_ID = '550e8400-e29b-41d4-a716-446655440003';
const DATE = new Date('2024-01-01T00:00:00.000Z');

const buildTask = (status = TaskStatusEnum.PENDING, queueJobId?: string) =>
  new TaskBuilder()
    .withId(TASK_ID)
    .withTemplateId(TEMPLATE_ID)
    .withUserId(USER_ID)
    .withStatus(status)
    .withQueueJobId(queueJobId ?? null)
    .withCreatedAt(DATE)
    .withUpdatedAt(DATE)
    .build();

const buildCommand = () =>
  new CancelTaskCommand({ id: TASK_ID, userId: USER_ID });

describe('CancelTaskCommandHandler', () => {
  let handler: CancelTaskCommandHandler;
  let taskWriteRepo: jest.Mocked<ITaskWriteRepository>;
  let taskQueueProvider: jest.Mocked<ITaskQueueProvider>;
  let assertTaskExistsService: jest.Mocked<AssertTaskExistsService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    taskWriteRepo = {
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ITaskWriteRepository>;

    taskQueueProvider = {
      enqueue: jest.fn(),
      cancel: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ITaskQueueProvider>;

    assertTaskExistsService = {
      execute: jest.fn().mockResolvedValue(buildTask()),
    } as unknown as jest.Mocked<AssertTaskExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CancelTaskCommandHandler(
      taskWriteRepo,
      taskQueueProvider,
      assertTaskExistsService,
      new AssertTaskCancellableService(),
      eventBus,
    );
  });

  it('marks the task as CANCELLED and saves it', async () => {
    await handler.execute(buildCommand());

    expect(taskWriteRepo.save).toHaveBeenCalledTimes(1);
    const saved = (taskWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.status.value).toBe(TaskStatusEnum.CANCELLED);
  });

  it('publishes domain events after cancellation', async () => {
    await handler.execute(buildCommand());
    expect(eventBus.publishAll).toHaveBeenCalled();
  });

  it('cancels the queue job when the task has a queueJobId', async () => {
    assertTaskExistsService.execute.mockResolvedValue(
      buildTask(TaskStatusEnum.PENDING, 'job-42'),
    );

    await handler.execute(buildCommand());

    expect(taskQueueProvider.cancel).toHaveBeenCalledWith('job-42');
  });

  it('skips queue cancel when there is no queueJobId', async () => {
    assertTaskExistsService.execute.mockResolvedValue(
      buildTask(TaskStatusEnum.PENDING, undefined),
    );

    await handler.execute(buildCommand());

    expect(taskQueueProvider.cancel).not.toHaveBeenCalled();
  });

  it('throws TaskNotCancellableException when task is ACTIVE', async () => {
    assertTaskExistsService.execute.mockResolvedValue(
      buildTask(TaskStatusEnum.ACTIVE),
    );

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      TaskNotCancellableException,
    );
    expect(taskWriteRepo.save).not.toHaveBeenCalled();
  });

  it('throws TaskNotCancellableException when task is COMPLETED', async () => {
    assertTaskExistsService.execute.mockResolvedValue(
      buildTask(TaskStatusEnum.COMPLETED),
    );

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      TaskNotCancellableException,
    );
  });
});
