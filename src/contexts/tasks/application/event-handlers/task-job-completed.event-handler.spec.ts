import { TaskJobCompletedEvent } from '@core/queue/domain/events/task-job-completed/task-job-completed.event';
import { buildTaskJobEventMetadata } from '@core/queue/domain/events/task-job-event-metadata';
import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskRunBuilder } from '@contexts/tasks/domain/builders/task-run.builder';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { ITaskWriteRepository } from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { ITaskRunWriteRepository } from '@contexts/tasks/domain/repositories/write/task-run-write.repository';

import { TaskJobCompletedEventHandler } from './task-job-completed.event-handler';

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440002';
const USER_ID = '550e8400-e29b-41d4-a716-446655440003';
const RUN_ID = '550e8400-e29b-41d4-a716-446655440004';
const DATE = new Date('2024-01-01T00:00:00.000Z');

const buildTask = (status = TaskStatusEnum.ACTIVE) =>
  new TaskBuilder()
    .withId(TASK_ID)
    .withTemplateId(TEMPLATE_ID)
    .withUserId(USER_ID)
    .withStatus(status)
    .withCreatedAt(DATE)
    .withUpdatedAt(DATE)
    .build();

const buildRun = () =>
  new TaskRunBuilder()
    .withId(RUN_ID)
    .withTaskId(TASK_ID)
    .withAttempt(1)
    .withStartedAt(DATE)
    .withCreatedAt(DATE)
    .withUpdatedAt(DATE)
    .build();

const buildEvent = () =>
  new TaskJobCompletedEvent(
    buildTaskJobEventMetadata(TASK_ID, TaskJobCompletedEvent.name),
    { taskId: TASK_ID },
  );

describe('TaskJobCompletedEventHandler', () => {
  let handler: TaskJobCompletedEventHandler;
  let taskWriteRepo: jest.Mocked<ITaskWriteRepository>;
  let taskRunWriteRepo: jest.Mocked<ITaskRunWriteRepository>;
  let assertTaskExistsService: jest.Mocked<AssertTaskExistsService>;

  beforeEach(() => {
    taskWriteRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ITaskWriteRepository>;

    taskRunWriteRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
      findActiveByTaskId: jest.fn(),
    } as unknown as jest.Mocked<ITaskRunWriteRepository>;

    assertTaskExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertTaskExistsService>;

    handler = new TaskJobCompletedEventHandler(
      taskWriteRepo,
      taskRunWriteRepo,
      assertTaskExistsService,
    );
  });

  it('marks the task as completed and saves it', async () => {
    const task = buildTask(TaskStatusEnum.ACTIVE);
    assertTaskExistsService.execute.mockResolvedValue(task);
    taskRunWriteRepo.findActiveByTaskId.mockResolvedValue(null);

    await handler.handle(buildEvent());

    expect(taskWriteRepo.save).toHaveBeenCalledTimes(1);
    const saved = (taskWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.status.value).toBe(TaskStatusEnum.COMPLETED);
  });

  it('marks the active run as completed and saves it', async () => {
    const task = buildTask(TaskStatusEnum.ACTIVE);
    const run = buildRun();
    assertTaskExistsService.execute.mockResolvedValue(task);
    taskRunWriteRepo.findActiveByTaskId.mockResolvedValue(run);

    await handler.handle(buildEvent());

    expect(taskRunWriteRepo.save).toHaveBeenCalledTimes(1);
    const savedRun = (taskRunWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(savedRun.endedAt).not.toBeNull();
  });

  it('does not save a run when none is found', async () => {
    const task = buildTask(TaskStatusEnum.ACTIVE);
    assertTaskExistsService.execute.mockResolvedValue(task);
    taskRunWriteRepo.findActiveByTaskId.mockResolvedValue(null);

    await handler.handle(buildEvent());

    expect(taskRunWriteRepo.save).not.toHaveBeenCalled();
  });

  it('does not overwrite a COMPLETED task when event fires out of order (regression #159)', async () => {
    const task = buildTask(TaskStatusEnum.COMPLETED);
    assertTaskExistsService.execute.mockResolvedValue(task);
    taskRunWriteRepo.findActiveByTaskId.mockResolvedValue(null);

    await handler.handle(buildEvent());

    const saved = (taskWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.status.value).toBe(TaskStatusEnum.COMPLETED);
  });

  it('looks up the task by the event taskId', async () => {
    const task = buildTask();
    assertTaskExistsService.execute.mockResolvedValue(task);
    taskRunWriteRepo.findActiveByTaskId.mockResolvedValue(null);

    await handler.handle(buildEvent());

    expect(assertTaskExistsService.execute).toHaveBeenCalledWith(TASK_ID);
  });
});
