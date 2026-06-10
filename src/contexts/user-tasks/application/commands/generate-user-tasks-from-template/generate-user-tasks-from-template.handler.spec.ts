import { EventBus } from '@nestjs/cqrs';

import { UserTaskBuilder } from '@contexts/user-tasks/domain/builders/user-task.builder';
import { UserTaskRecurrenceLimitExceededException } from '@contexts/user-tasks/domain/exceptions/user-task-recurrence-limit-exceeded.exception';

import { GenerateUserTasksFromTemplateCommand } from './generate-user-tasks-from-template.command';
import {
  GenerateUserTasksFromTemplateCommandHandler,
  MAX_USER_TASK_INSTANCES,
} from './generate-user-tasks-from-template.handler';

const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';

const makeDates = (count: number): Date[] =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date('2024-06-10');
    d.setDate(d.getDate() + i);
    return d;
  });

describe('GenerateUserTasksFromTemplateCommandHandler', () => {
  let handler: GenerateUserTasksFromTemplateCommandHandler;
  let mockWriteRepo: {
    saveMany: jest.Mock;
    save: jest.Mock;
    findById: jest.Mock;
    findByCriteria: jest.Mock;
    delete: jest.Mock;
    deleteByTemplateId: jest.Mock;
  };
  let mockTemplateReadRepo: {
    findById: jest.Mock;
    findByCriteria: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let mockEventBus: { publish: jest.Mock; publishAll: jest.Mock };

  beforeEach(() => {
    mockWriteRepo = {
      saveMany: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
      deleteByTemplateId: jest.fn(),
    };
    mockTemplateReadRepo = {
      findById: jest.fn().mockResolvedValue({
        id: TEMPLATE_ID,
        name: 'Water plant',
        handlerKey: null,
      }),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    mockEventBus = { publish: jest.fn(), publishAll: jest.fn() };

    handler = new GenerateUserTasksFromTemplateCommandHandler(
      mockWriteRepo as any,
      mockTemplateReadRepo as any,
      new UserTaskBuilder(),
      mockEventBus as unknown as EventBus,
    );
  });

  it('saves the correct number of tasks via saveMany', async () => {
    const dates = makeDates(5);
    const command = new GenerateUserTasksFromTemplateCommand({
      taskTemplateId: TEMPLATE_ID,
      userId: USER_ID,
      scheduledDates: dates,
    });

    await handler.execute(command);

    expect(mockWriteRepo.saveMany).toHaveBeenCalledTimes(1);
    const tasks = mockWriteRepo.saveMany.mock.calls[0][0];
    expect(tasks).toHaveLength(5);
  });

  it('each task has the correct scheduledDate', async () => {
    const dates = makeDates(3);
    const command = new GenerateUserTasksFromTemplateCommand({
      taskTemplateId: TEMPLATE_ID,
      userId: USER_ID,
      scheduledDates: dates,
    });

    await handler.execute(command);

    const tasks = mockWriteRepo.saveMany.mock.calls[0][0];
    expect(tasks[0].scheduledDate.value).toEqual(dates[0]);
    expect(tasks[1].scheduledDate.value).toEqual(dates[1]);
    expect(tasks[2].scheduledDate.value).toEqual(dates[2]);
  });

  it('throws UserTaskRecurrenceLimitExceededException when exceeding MAX_USER_TASK_INSTANCES', async () => {
    const dates = makeDates(MAX_USER_TASK_INSTANCES + 1);
    const command = new GenerateUserTasksFromTemplateCommand({
      taskTemplateId: TEMPLATE_ID,
      userId: USER_ID,
      scheduledDates: dates,
    });

    await expect(handler.execute(command)).rejects.toThrow(
      UserTaskRecurrenceLimitExceededException,
    );
    expect(mockWriteRepo.saveMany).not.toHaveBeenCalled();
  });

  it('does not call saveMany when scheduledDates is empty', async () => {
    const command = new GenerateUserTasksFromTemplateCommand({
      taskTemplateId: TEMPLATE_ID,
      userId: USER_ID,
      scheduledDates: [],
    });

    await handler.execute(command);

    expect(mockWriteRepo.saveMany).not.toHaveBeenCalled();
  });
});
