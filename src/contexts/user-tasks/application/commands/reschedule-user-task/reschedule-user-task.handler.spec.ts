import { EventBus } from '@nestjs/cqrs';

import { AssertUserTaskExistsService } from '@contexts/user-tasks/application/services/write/assert-user-task-exists/assert-user-task-exists.service';
import { UserTaskBuilder } from '@contexts/user-tasks/domain/builders/user-task.builder';
import { UserTaskNotReschedulableException } from '@contexts/user-tasks/domain/exceptions/user-task-not-reschedulable.exception';

import { RescheduleUserTaskCommand } from './reschedule-user-task.command';
import { RescheduleUserTaskCommandHandler } from './reschedule-user-task.handler';

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const TODAY = new Date('2024-06-10T00:00:00.000Z');
const YESTERDAY = new Date('2024-06-09T00:00:00.000Z');
const NEXT_WEEK = new Date('2024-06-17T00:00:00.000Z');

const buildPendingTask = () =>
  new UserTaskBuilder()
    .withId(TASK_ID)
    .withTitle('Buy groceries')
    .withUserId(USER_ID)
    .withScheduledDate(YESTERDAY)
    .withCreatedAt(TODAY)
    .withUpdatedAt(TODAY)
    .build();

describe('RescheduleUserTaskCommandHandler', () => {
  let handler: RescheduleUserTaskCommandHandler;
  let mockWriteRepo: {
    save: jest.Mock;
    findById: jest.Mock;
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
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
      saveMany: jest.fn(),
      deleteByTemplateId: jest.fn(),
    };
    mockAssertExists = {
      execute: jest.fn().mockResolvedValue(buildPendingTask()),
    };
    mockEventBus = { publish: jest.fn(), publishAll: jest.fn() };

    handler = new RescheduleUserTaskCommandHandler(
      mockWriteRepo as any,
      mockAssertExists as any,
      mockEventBus as unknown as EventBus,
    );
  });

  it('updates scheduledDate and saves', async () => {
    const command = new RescheduleUserTaskCommand({
      id: TASK_ID,
      userId: USER_ID,
      newScheduledDate: NEXT_WEEK,
    });

    await handler.execute(command);

    const savedTask = mockWriteRepo.save.mock.calls[0][0];
    expect(savedTask.scheduledDate.value).toEqual(NEXT_WEEK);
  });

  it('throws UserTaskNotReschedulableException when task is cancelled', async () => {
    const task = buildPendingTask();
    task.cancel();
    mockAssertExists.execute.mockResolvedValue(task);

    await expect(
      handler.execute(
        new RescheduleUserTaskCommand({
          id: TASK_ID,
          userId: USER_ID,
          newScheduledDate: NEXT_WEEK,
        }),
      ),
    ).rejects.toThrow(UserTaskNotReschedulableException);
    expect(mockWriteRepo.save).not.toHaveBeenCalled();
  });
});
