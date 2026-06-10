import { EventBus } from '@nestjs/cqrs';

import { AssertUserTaskExistsService } from '@contexts/user-tasks/application/services/write/assert-user-task-exists/assert-user-task-exists.service';
import { UserTaskBuilder } from '@contexts/user-tasks/domain/builders/user-task.builder';
import { UserTaskStatusEnum } from '@contexts/user-tasks/domain/enums/user-task-status.enum';
import { UserTaskNotCancellableException } from '@contexts/user-tasks/domain/exceptions/user-task-not-cancellable.exception';
import { UserTaskNotFoundException } from '@contexts/user-tasks/domain/exceptions/user-task-not-found.exception';

import { CancelUserTaskCommand } from './cancel-user-task.command';
import { CancelUserTaskCommandHandler } from './cancel-user-task.handler';

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const TODAY = new Date('2024-06-10T00:00:00.000Z');
const YESTERDAY = new Date('2024-06-09T00:00:00.000Z');

const buildPendingTask = () =>
  new UserTaskBuilder()
    .withId(TASK_ID)
    .withTitle('Buy groceries')
    .withUserId(USER_ID)
    .withScheduledDate(YESTERDAY)
    .withCreatedAt(TODAY)
    .withUpdatedAt(TODAY)
    .build();

describe('CancelUserTaskCommandHandler', () => {
  let handler: CancelUserTaskCommandHandler;
  let mockWriteRepo: {
    findById: jest.Mock;
    save: jest.Mock;
    findByCriteria: jest.Mock;
    delete: jest.Mock;
    saveMany: jest.Mock;
    deleteByTemplateId: jest.Mock;
  };
  let mockAssertExists: jest.Mocked<
    Pick<AssertUserTaskExistsService, 'execute'>
  >;
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
    mockAssertExists = {
      execute: jest.fn().mockResolvedValue(buildPendingTask()),
    };
    mockEventBus = { publish: jest.fn(), publishAll: jest.fn() };

    handler = new CancelUserTaskCommandHandler(
      mockWriteRepo as any,
      mockAssertExists as any,
      mockEventBus as unknown as EventBus,
    );
  });

  it('cancels a pending task', async () => {
    await handler.execute(
      new CancelUserTaskCommand({ id: TASK_ID, userId: USER_ID }),
    );

    const savedTask = mockWriteRepo.save.mock.calls[0][0];
    expect(savedTask.status.value).toBe(UserTaskStatusEnum.CANCELLED);
  });

  it('throws UserTaskNotFoundException when task does not exist', async () => {
    mockAssertExists.execute.mockRejectedValue(
      new UserTaskNotFoundException(TASK_ID),
    );
    await expect(
      handler.execute(
        new CancelUserTaskCommand({ id: TASK_ID, userId: USER_ID }),
      ),
    ).rejects.toThrow(UserTaskNotFoundException);
    expect(mockWriteRepo.save).not.toHaveBeenCalled();
  });

  it('throws when task is already cancelled', async () => {
    const task = buildPendingTask();
    task.cancel(); // put in cancelled state
    mockAssertExists.execute.mockResolvedValue(task);

    await expect(
      handler.execute(
        new CancelUserTaskCommand({ id: TASK_ID, userId: USER_ID }),
      ),
    ).rejects.toThrow(UserTaskNotCancellableException);
  });
});
