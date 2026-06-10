import { EventBus } from '@nestjs/cqrs';

import { AssertTaskTemplateExistsService } from '@contexts/tasks/application/services/write/assert-task-template-exists/assert-task-template-exists.service';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskTemplateBuilder } from '@contexts/tasks/domain/builders/task-template.builder';
import { TaskTemplateHandlerKeyRequiredException } from '@contexts/tasks/domain/exceptions/task-template-handler-key-required.exception';
import { ITaskReadRepository } from '@contexts/tasks/domain/repositories/read/task-read.repository';
import { ITaskWriteRepository } from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { ITaskQueueProvider } from '@core/queue/application/ports/task-queue-provider.port';

import { ScheduleTaskCommand } from './schedule-task.command';
import { ScheduleTaskCommandHandler } from './schedule-task.handler';

const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const DATE = new Date('2024-01-01T00:00:00.000Z');

const buildNullHandlerTemplate = () =>
  new TaskTemplateBuilder()
    .withId(TEMPLATE_ID)
    .withName('informative-task')
    .withHandlerKey(null)
    .withUserId(USER_ID)
    .withCreatedAt(DATE)
    .withUpdatedAt(DATE)
    .build();

describe('ScheduleTaskCommandHandler — null handlerKey guard', () => {
  let handler: ScheduleTaskCommandHandler;
  let taskWriteRepo: jest.Mocked<ITaskWriteRepository>;
  let taskReadRepo: jest.Mocked<ITaskReadRepository>;
  let taskQueueProvider: jest.Mocked<ITaskQueueProvider>;
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
      execute: jest.fn().mockResolvedValue(buildNullHandlerTemplate()),
    } as unknown as jest.Mocked<AssertTaskTemplateExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new ScheduleTaskCommandHandler(
      taskWriteRepo,
      taskReadRepo,
      taskQueueProvider,
      new TaskBuilder(),
      assertTaskTemplateExistsService,
      eventBus,
    );
  });

  it('throws TaskTemplateHandlerKeyRequiredException when handlerKey is null', async () => {
    const command = new ScheduleTaskCommand({
      templateId: TEMPLATE_ID,
      userId: USER_ID,
      payload: {},
      idempotencyKey: null,
    });

    await expect(handler.execute(command)).rejects.toThrow(
      TaskTemplateHandlerKeyRequiredException,
    );
    expect(taskWriteRepo.save).not.toHaveBeenCalled();
    expect(taskQueueProvider.enqueue).not.toHaveBeenCalled();
  });
});
