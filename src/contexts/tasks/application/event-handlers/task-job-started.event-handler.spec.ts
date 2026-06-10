import { TaskJobStartedEvent } from '@core/queue/domain/events/task-job-started/task-job-started.event';
import { buildTaskJobEventMetadata } from '@core/queue/domain/events/task-job-event-metadata';
import { AssertTaskExistsService } from '@contexts/tasks/application/services/write/assert-task-exists/assert-task-exists.service';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskRunBuilder } from '@contexts/tasks/domain/builders/task-run.builder';
import { TaskRunStatusEnum } from '@contexts/tasks/domain/enums/task-run-status.enum';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { ITaskWriteRepository } from '@contexts/tasks/domain/repositories/write/task-write.repository';
import { ITaskRunWriteRepository } from '@contexts/tasks/domain/repositories/write/task-run-write.repository';

import { TaskJobStartedEventHandler } from './task-job-started.event-handler';

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440002';
const USER_ID = '550e8400-e29b-41d4-a716-446655440003';
const DATE = new Date('2024-01-01T00:00:00.000Z');

const buildTask = (status = TaskStatusEnum.PENDING) =>
  new TaskBuilder()
    .withId(TASK_ID)
    .withTemplateId(TEMPLATE_ID)
    .withUserId(USER_ID)
    .withStatus(status)
    .withCreatedAt(DATE)
    .withUpdatedAt(DATE)
    .build();

const buildEvent = () =>
  new TaskJobStartedEvent(
    buildTaskJobEventMetadata(TASK_ID, TaskJobStartedEvent.name),
    { taskId: TASK_ID, queueJobId: 'job-1' },
  );

describe('TaskJobStartedEventHandler', () => {
  let handler: TaskJobStartedEventHandler;
  let taskWriteRepo: jest.Mocked<ITaskWriteRepository>;
  let taskRunWriteRepo: jest.Mocked<ITaskRunWriteRepository>;
  let assertTaskExistsService: jest.Mocked<AssertTaskExistsService>;
  let taskRunBuilder: TaskRunBuilder;

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

    taskRunBuilder = new TaskRunBuilder();

    handler = new TaskJobStartedEventHandler(
      taskWriteRepo,
      taskRunWriteRepo,
      assertTaskExistsService,
      taskRunBuilder,
    );
  });

  it('marks the task as active and saves it', async () => {
    const task = buildTask(TaskStatusEnum.PENDING);
    assertTaskExistsService.execute.mockResolvedValue(task);

    await handler.handle(buildEvent());

    expect(taskWriteRepo.save).toHaveBeenCalledTimes(1);
    const saved = (taskWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(saved.status.value).toBe(TaskStatusEnum.ACTIVE);
  });

  it('increments runCount on the task', async () => {
    const task = buildTask(TaskStatusEnum.PENDING);
    assertTaskExistsService.execute.mockResolvedValue(task);

    expect(task.runCount.value).toBe(0);
    await handler.handle(buildEvent());
    expect(task.runCount.value).toBe(1);
  });

  it('creates and saves a new active TaskRun', async () => {
    const task = buildTask(TaskStatusEnum.PENDING);
    assertTaskExistsService.execute.mockResolvedValue(task);

    await handler.handle(buildEvent());

    expect(taskRunWriteRepo.save).toHaveBeenCalledTimes(1);
    const savedRun = (taskRunWriteRepo.save as jest.Mock).mock.calls[0][0];
    expect(savedRun.status.value).toBe(TaskRunStatusEnum.ACTIVE);
    expect(savedRun.taskId.value).toBe(TASK_ID);
  });

  it('skips all writes when task is already in terminal state — regression #159', async () => {
    const task = buildTask(TaskStatusEnum.COMPLETED);
    assertTaskExistsService.execute.mockResolvedValue(task);

    await handler.handle(buildEvent());

    expect(taskWriteRepo.save).not.toHaveBeenCalled();
    expect(taskRunWriteRepo.save).not.toHaveBeenCalled();
    expect(task.status.value).toBe(TaskStatusEnum.COMPLETED);
  });

  it('looks up the task by the event taskId', async () => {
    const task = buildTask();
    assertTaskExistsService.execute.mockResolvedValue(task);

    await handler.handle(buildEvent());

    expect(assertTaskExistsService.execute).toHaveBeenCalledWith(TASK_ID);
  });
});
