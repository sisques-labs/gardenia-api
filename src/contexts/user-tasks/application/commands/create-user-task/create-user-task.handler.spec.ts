import { EventBus } from '@nestjs/cqrs';

import { UserTaskBuilder } from '@contexts/user-tasks/domain/builders/user-task.builder';
import { UserTaskCreatedEvent } from '@contexts/user-tasks/domain/events/user-task-created/user-task-created.event';

import { CreateUserTaskCommand } from './create-user-task.command';
import { CreateUserTaskCommandHandler } from './create-user-task.handler';

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';

describe('CreateUserTaskCommandHandler', () => {
  let handler: CreateUserTaskCommandHandler;
  let mockRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findByCriteria: jest.Mock;
    delete: jest.Mock;
    saveMany: jest.Mock;
    deleteByTemplateId: jest.Mock;
  };
  let mockEventBus: { publish: jest.Mock; publishAll: jest.Mock };
  let builder: UserTaskBuilder;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
      saveMany: jest.fn(),
      deleteByTemplateId: jest.fn(),
    };
    mockEventBus = { publish: jest.fn(), publishAll: jest.fn() };
    builder = new UserTaskBuilder();
    handler = new CreateUserTaskCommandHandler(
      mockRepo as any,
      builder,
      mockEventBus as unknown as EventBus,
    );
  });

  it('saves a new UserTask', async () => {
    const command = new CreateUserTaskCommand({
      id: TASK_ID,
      title: 'Buy groceries',
      description: null,
      scheduledDate: new Date('2024-06-10'),
      userId: USER_ID,
      taskTemplateId: null,
    });

    await handler.execute(command);

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    const savedTask = mockRepo.save.mock.calls[0][0];
    expect(savedTask.id.value).toBe(TASK_ID);
    expect(savedTask.title.value).toBe('Buy groceries');
  });

  it('publishes UserTaskCreatedEvent', async () => {
    const capturedEvents: unknown[][] = [];
    (mockEventBus.publishAll as jest.Mock).mockImplementation(
      (events: unknown[]) => {
        capturedEvents.push([...events]);
        return Promise.resolve();
      },
    );

    const command = new CreateUserTaskCommand({
      id: TASK_ID,
      title: 'Buy groceries',
      description: null,
      scheduledDate: new Date('2024-06-10'),
      userId: USER_ID,
      taskTemplateId: null,
    });

    await handler.execute(command);

    const allEvents = capturedEvents.flat();
    expect(allEvents.some((e) => e instanceof UserTaskCreatedEvent)).toBe(true);
  });
});
