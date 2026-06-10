import { EventBus } from '@nestjs/cqrs';

import { AssertTaskTemplateExistsService } from '@contexts/tasks/application/services/write/assert-task-template-exists/assert-task-template-exists.service';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskTemplateBuilder } from '@contexts/tasks/domain/builders/task-template.builder';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { TaskDuplicateIdempotencyKeyException } from '@contexts/tasks/domain/exceptions/task-duplicate-idempotency-key.exception';
import { ITaskReadRepository } from '@contexts/tasks/domain/repositories/read/task-read.repository';
import { ITaskWriteRepository } from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { ITaskQueueProvider } from '@core/queue/application/ports/task-queue-provider.port';

import { ScheduleTaskCommand } from './schedule-task.command';
import { ScheduleTaskCommandHandler } from './schedule-task.handler';

const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const TASK_ID = '550e8400-e29b-41d4-a716-446655440003';
const DATE = new Date('2024-01-01T00:00:00.000Z');

const buildTemplate = () =>
  new TaskTemplateBuilder()
    .withId(TEMPLATE_ID)
    .withName('water-plant')
    .withHandlerKey('water-plant')
    .withUserId(USER_ID)
    .withCreatedAt(DATE)
    .withUpdatedAt(DATE)
    .build();

const buildCommand = (overrides?: { idempotencyKey?: string }) =>
  new ScheduleTaskCommand({
    templateId: TEMPLATE_ID,
    userId: USER_ID,
    payload: { plantId: 'p1' },
    idempotencyKey: overrides?.idempotencyKey ?? null,
  });

describe('ScheduleTaskCommandHandler', () => {
  let handler: ScheduleTaskCommandHandler;
  let taskWriteRepo: jest.Mocked<ITaskWriteRepository>;
  let taskReadRepo: jest.Mocked<ITaskReadRepository>;
  let taskQueueProvider: jest.Mocked<ITaskQueueProvider>;
  let taskBuilder: TaskBuilder;
  let assertTaskTemplateExistsService: jest.Mocked<AssertTaskTemplateExistsService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    taskWriteRepo = {
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ITaskWriteRepository>;

    taskReadRepo = {
      findByIdempotencyKey: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<ITaskReadRepository>;

    taskQueueProvider = {
      enqueue: jest.fn().mockResolvedValue('queue-job-1'),
      cancel: jest.fn(),
    } as unknown as jest.Mocked<ITaskQueueProvider>;

    assertTaskTemplateExistsService = {
      execute: jest.fn().mockResolvedValue(buildTemplate()),
    } as unknown as jest.Mocked<AssertTaskTemplateExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    taskBuilder = new TaskBuilder();

    handler = new ScheduleTaskCommandHandler(
      taskWriteRepo,
      taskReadRepo,
      taskQueueProvider,
      taskBuilder,
      assertTaskTemplateExistsService,
      eventBus,
    );
  });

  it('returns a task id string', async () => {
    const result = await handler.execute(buildCommand());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('persists the task twice — once before enqueue, once after setting queueJobId', async () => {
    await handler.execute(buildCommand());
    expect(taskWriteRepo.save).toHaveBeenCalledTimes(2);
  });

  it('enqueues the task with the template handlerKey', async () => {
    await handler.execute(buildCommand());
    expect(taskQueueProvider.enqueue).toHaveBeenCalledTimes(1);
    const enqueueArg = (taskQueueProvider.enqueue as jest.Mock).mock
      .calls[0][0];
    expect(enqueueArg.handlerKey).toBe('water-plant');
  });

  it('publishes domain events after scheduling', async () => {
    await handler.execute(buildCommand());
    expect(eventBus.publishAll).toHaveBeenCalled();
  });

  it('creates the task with PENDING status', async () => {
    await handler.execute(buildCommand());
    const firstSave = (taskWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(firstSave.status.value).toBe(TaskStatusEnum.PENDING);
  });

  it('throws TaskDuplicateIdempotencyKeyException when key already exists', async () => {
    const existingTask = new TaskBuilder()
      .withId(TASK_ID)
      .withTemplateId(TEMPLATE_ID)
      .withUserId(USER_ID)
      .withCreatedAt(DATE)
      .withUpdatedAt(DATE)
      .build();

    taskReadRepo.findByIdempotencyKey = jest
      .fn()
      .mockResolvedValue(existingTask);

    await expect(
      handler.execute(buildCommand({ idempotencyKey: 'idem-key-1' })),
    ).rejects.toThrow(TaskDuplicateIdempotencyKeyException);
    expect(taskWriteRepo.save).not.toHaveBeenCalled();
  });

  it('skips idempotency check when no key is provided', async () => {
    await handler.execute(buildCommand());
    expect(taskReadRepo.findByIdempotencyKey).not.toHaveBeenCalled();
  });
});
