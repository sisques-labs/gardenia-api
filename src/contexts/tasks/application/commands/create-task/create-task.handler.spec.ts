import { EventBus } from '@nestjs/cqrs';

import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskTriggerTypeEnum } from '@contexts/tasks/domain/enums/task-trigger-type.enum';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { ITaskWriteRepository } from '@contexts/tasks/domain/repositories/write/task-write.repository';

import { CreateTaskCommand } from './create-task.command';
import { CreateTaskCommandHandler } from './create-task.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';

const buildCommand = (
  overrides?: Partial<{
    title: string;
    description: string | null;
    scheduledAt: Date | null;
  }>,
) =>
  new CreateTaskCommand({
    title: overrides?.title ?? 'Buy milk',
    description: overrides?.description ?? null,
    scheduledAt: overrides?.scheduledAt ?? null,
    userId: USER_ID,
  });

describe('CreateTaskCommandHandler', () => {
  let handler: CreateTaskCommandHandler;
  let taskWriteRepo: jest.Mocked<ITaskWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    taskWriteRepo = {
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ITaskWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CreateTaskCommandHandler(
      taskWriteRepo,
      new TaskBuilder(),
      eventBus,
    );
  });

  it('saves a task with triggerType USER and status PENDING', async () => {
    await handler.execute(buildCommand());

    expect(taskWriteRepo.save).toHaveBeenCalledTimes(1);
    const saved = (taskWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.triggerType.value).toBe(TaskTriggerTypeEnum.USER);
    expect(saved.status.value).toBe(TaskStatusEnum.PENDING);
    expect(saved.templateId).toBeNull();
  });

  it('returns the generated task id', async () => {
    const id = await handler.execute(buildCommand());
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('stores the title from the command', async () => {
    await handler.execute(buildCommand({ title: 'Walk the dog' }));
    const saved = (taskWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.title.value).toBe('Walk the dog');
  });

  it('stores null description when not provided', async () => {
    await handler.execute(buildCommand({ description: null }));
    const saved = (taskWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.description).toBeNull();
  });

  it('publishes domain events after save', async () => {
    await handler.execute(buildCommand());
    expect(eventBus.publishAll).toHaveBeenCalled();
  });
});
