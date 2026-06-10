import { EventBus } from '@nestjs/cqrs';

import { TaskHandlerRegistry } from '@core/queue/application/registry/task-handler.registry';
import { AssertUserTaskExistsService } from '@contexts/user-tasks/application/services/write/assert-user-task-exists/assert-user-task-exists.service';
import { UserTaskBuilder } from '@contexts/user-tasks/domain/builders/user-task.builder';
import { UserTaskStatusEnum } from '@contexts/user-tasks/domain/enums/user-task-status.enum';
import { UserTaskNotCompletableException } from '@contexts/user-tasks/domain/exceptions/user-task-not-completable.exception';

import { CompleteUserTaskCommand } from './complete-user-task.command';
import { CompleteUserTaskCommandHandler } from './complete-user-task.handler';

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440003';
const YESTERDAY = new Date('2024-06-09T00:00:00.000Z');
const TODAY = new Date('2024-06-10T00:00:00.000Z');
const TOMORROW = new Date('2024-06-11T00:00:00.000Z');

const buildTask = (
  scheduledDate = YESTERDAY,
  templateId: string | null = null,
) =>
  new UserTaskBuilder()
    .withId(TASK_ID)
    .withTitle('Buy groceries')
    .withUserId(USER_ID)
    .withScheduledDate(scheduledDate)
    .withTaskTemplateId(templateId)
    .withCreatedAt(TODAY)
    .withUpdatedAt(TODAY)
    .build();

describe('CompleteUserTaskCommandHandler', () => {
  let handler: CompleteUserTaskCommandHandler;
  let mockWriteRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findByCriteria: jest.Mock;
    delete: jest.Mock;
    saveMany: jest.Mock;
    deleteByTemplateId: jest.Mock;
  };
  let mockTemplateReadRepo: {
    findById: jest.Mock;
    findByCriteria: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let mockAssertExists: jest.Mocked<
    Pick<AssertUserTaskExistsService, 'execute'>
  >;
  let mockRegistry: jest.Mocked<Pick<TaskHandlerRegistry, 'has' | 'dispatch'>>;
  let mockEventBus: { publish: jest.Mock; publishAll: jest.Mock };

  beforeEach(() => {
    mockWriteRepo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
      saveMany: jest.fn(),
      deleteByTemplateId: jest.fn(),
    };
    mockTemplateReadRepo = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    mockAssertExists = { execute: jest.fn().mockResolvedValue(buildTask()) };
    mockRegistry = {
      has: jest.fn().mockReturnValue(false),
      dispatch: jest.fn(),
    };
    mockEventBus = { publish: jest.fn(), publishAll: jest.fn() };

    handler = new CompleteUserTaskCommandHandler(
      mockWriteRepo as any,
      mockTemplateReadRepo as any,
      mockAssertExists as any,
      mockRegistry as any,
      mockEventBus as unknown as EventBus,
    );
  });

  it('completes a task with scheduledDate <= today', async () => {
    jest.useFakeTimers().setSystemTime(TODAY);
    const command = new CompleteUserTaskCommand({
      id: TASK_ID,
      userId: USER_ID,
    });

    await handler.execute(command);

    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
    const savedTask = mockWriteRepo.save.mock.calls[0][0];
    expect(savedTask.status.value).toBe(UserTaskStatusEnum.COMPLETED);
    jest.useRealTimers();
  });

  it('throws UserTaskNotCompletableException for future-dated task', async () => {
    jest.useFakeTimers().setSystemTime(TODAY);
    mockAssertExists.execute.mockResolvedValue(buildTask(TOMORROW));
    const command = new CompleteUserTaskCommand({
      id: TASK_ID,
      userId: USER_ID,
    });

    await expect(handler.execute(command)).rejects.toThrow(
      UserTaskNotCompletableException,
    );
    expect(mockWriteRepo.save).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('dispatches handler BEFORE saving when template has handlerKey', async () => {
    jest.useFakeTimers().setSystemTime(TODAY);
    const callOrder: string[] = [];

    mockAssertExists.execute.mockResolvedValue(
      buildTask(YESTERDAY, TEMPLATE_ID),
    );
    mockTemplateReadRepo.findById.mockResolvedValue({
      handlerKey: 'my-handler',
      id: TEMPLATE_ID,
    });
    mockRegistry.has.mockReturnValue(true);
    mockRegistry.dispatch.mockImplementation(async () => {
      callOrder.push('dispatch');
    });
    mockWriteRepo.save.mockImplementation(async () => {
      callOrder.push('save');
    });

    const command = new CompleteUserTaskCommand({
      id: TASK_ID,
      userId: USER_ID,
    });
    await handler.execute(command);

    expect(callOrder).toEqual(['dispatch', 'save']);
    jest.useRealTimers();
  });

  it('does not dispatch handler when template has no handlerKey', async () => {
    jest.useFakeTimers().setSystemTime(TODAY);
    mockAssertExists.execute.mockResolvedValue(
      buildTask(YESTERDAY, TEMPLATE_ID),
    );
    mockTemplateReadRepo.findById.mockResolvedValue({
      handlerKey: null,
      id: TEMPLATE_ID,
    });
    mockRegistry.has.mockReturnValue(false);

    const command = new CompleteUserTaskCommand({
      id: TASK_ID,
      userId: USER_ID,
    });
    await handler.execute(command);

    expect(mockRegistry.dispatch).not.toHaveBeenCalled();
    expect(mockWriteRepo.save).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
