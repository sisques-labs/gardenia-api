import { EventBus } from '@nestjs/cqrs';

import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskTriggerTypeEnum } from '@contexts/tasks/domain/enums/task-trigger-type.enum';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { TaskNotReschedulableException } from '@contexts/tasks/domain/exceptions/task-not-reschedulable.exception';
import { ITaskWriteRepository } from '@contexts/tasks/domain/repositories/write/task-write.repository';

import { RescheduleTaskCommand } from './reschedule-task.command';
import { RescheduleTaskCommandHandler } from './reschedule-task.handler';

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const DATE = new Date('2024-01-01T00:00:00.000Z');
const NEW_DATE = new Date('2024-03-01T00:00:00.000Z');

const buildUserTask = (status = TaskStatusEnum.PENDING) =>
  new TaskBuilder()
    .withId(TASK_ID)
    .withTriggerType(TaskTriggerTypeEnum.USER)
    .withTitle('Buy milk')
    .withUserId(USER_ID)
    .withStatus(status)
    .withScheduledAt(DATE)
    .withCreatedAt(DATE)
    .withUpdatedAt(DATE)
    .build();

const buildScheduledTask = () =>
  new TaskBuilder()
    .withId(TASK_ID)
    .withTemplateId('550e8400-e29b-41d4-a716-446655440099')
    .withUserId(USER_ID)
    .withStatus(TaskStatusEnum.PENDING)
    .withScheduledAt(DATE)
    .withCreatedAt(DATE)
    .withUpdatedAt(DATE)
    .build();

const buildCommand = () =>
  new RescheduleTaskCommand({
    id: TASK_ID,
    scheduledAt: NEW_DATE,
    userId: USER_ID,
  });

describe('RescheduleTaskCommandHandler', () => {
  let handler: RescheduleTaskCommandHandler;
  let taskWriteRepo: jest.Mocked<ITaskWriteRepository>;
  let assertTaskExistsService: jest.Mocked<AssertTaskExistsService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    taskWriteRepo = {
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ITaskWriteRepository>;

    assertTaskExistsService = {
      execute: jest.fn().mockResolvedValue(buildUserTask()),
    } as unknown as jest.Mocked<AssertTaskExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new RescheduleTaskCommandHandler(
      taskWriteRepo,
      assertTaskExistsService,
      eventBus,
    );
  });

  it('updates scheduledAt and saves the task', async () => {
    await handler.execute(buildCommand());

    expect(taskWriteRepo.save).toHaveBeenCalledTimes(1);
    const saved = (taskWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.scheduledAt?.value).toEqual(NEW_DATE);
  });

  it('publishes domain events after rescheduling', async () => {
    await handler.execute(buildCommand());
    expect(eventBus.publishAll).toHaveBeenCalled();
  });

  it('throws TaskNotReschedulableException for a scheduled (non-user) task', async () => {
    assertTaskExistsService.execute.mockResolvedValue(buildScheduledTask());

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      TaskNotReschedulableException,
    );
    expect(taskWriteRepo.save).not.toHaveBeenCalled();
  });

  it('throws TaskNotReschedulableException when task is not PENDING', async () => {
    assertTaskExistsService.execute.mockResolvedValue(
      buildUserTask(TaskStatusEnum.COMPLETED),
    );

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      TaskNotReschedulableException,
    );
  });
});
