import { EventBus } from '@nestjs/cqrs';

import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskTriggerTypeEnum } from '@contexts/tasks/domain/enums/task-trigger-type.enum';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { TaskNotCompletableException } from '@contexts/tasks/domain/exceptions/task-not-completable.exception';
import { ITaskWriteRepository } from '@contexts/tasks/domain/repositories/write/task-write.repository';

import { CompleteUserTaskCommand } from './complete-user-task.command';
import { CompleteUserTaskCommandHandler } from './complete-user-task.handler';

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const PAST_DATE = new Date('2024-01-01T00:00:00.000Z');

const buildUserTask = (
  scheduledAt: Date | null = PAST_DATE,
  status = TaskStatusEnum.PENDING,
) =>
  new TaskBuilder()
    .withId(TASK_ID)
    .withTriggerType(TaskTriggerTypeEnum.USER)
    .withTitle('Buy milk')
    .withUserId(USER_ID)
    .withStatus(status)
    .withScheduledAt(scheduledAt)
    .withCreatedAt(PAST_DATE)
    .withUpdatedAt(PAST_DATE)
    .build();

const buildScheduledTask = () =>
  new TaskBuilder()
    .withId(TASK_ID)
    .withTemplateId('550e8400-e29b-41d4-a716-446655440099')
    .withUserId(USER_ID)
    .withStatus(TaskStatusEnum.PENDING)
    .withScheduledAt(PAST_DATE)
    .withCreatedAt(PAST_DATE)
    .withUpdatedAt(PAST_DATE)
    .build();

const buildCommand = () =>
  new CompleteUserTaskCommand({ id: TASK_ID, userId: USER_ID });

describe('CompleteUserTaskCommandHandler', () => {
  let handler: CompleteUserTaskCommandHandler;
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

    handler = new CompleteUserTaskCommandHandler(
      taskWriteRepo,
      assertTaskExistsService,
      eventBus,
    );
  });

  it('marks the task as COMPLETED and saves it', async () => {
    await handler.execute(buildCommand());

    expect(taskWriteRepo.save).toHaveBeenCalledTimes(1);
    const saved = (taskWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.status.value).toBe(TaskStatusEnum.COMPLETED);
  });

  it('publishes domain events after completion', async () => {
    await handler.execute(buildCommand());
    expect(eventBus.publishAll).toHaveBeenCalled();
  });

  it('throws TaskNotCompletableException for a non-user task', async () => {
    assertTaskExistsService.execute.mockResolvedValue(buildScheduledTask());

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      TaskNotCompletableException,
    );
    expect(taskWriteRepo.save).not.toHaveBeenCalled();
  });

  it('throws TaskNotCompletableException when task is already COMPLETED', async () => {
    assertTaskExistsService.execute.mockResolvedValue(
      buildUserTask(PAST_DATE, TaskStatusEnum.COMPLETED),
    );

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      TaskNotCompletableException,
    );
  });

  it('throws TaskNotCompletableException when scheduledAt is in the future', async () => {
    const futureDate = new Date(Date.now() + 86_400_000 * 2);
    assertTaskExistsService.execute.mockResolvedValue(
      buildUserTask(futureDate),
    );

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      TaskNotCompletableException,
    );
  });
});
