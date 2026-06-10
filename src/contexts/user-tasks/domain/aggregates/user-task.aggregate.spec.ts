import { UserTaskStatusEnum } from '@contexts/user-tasks/domain/enums/user-task-status.enum';
import { UserTaskCancelledEvent } from '@contexts/user-tasks/domain/events/user-task-cancelled/user-task-cancelled.event';
import { UserTaskCompletedEvent } from '@contexts/user-tasks/domain/events/user-task-completed/user-task-completed.event';
import { UserTaskCreatedEvent } from '@contexts/user-tasks/domain/events/user-task-created/user-task-created.event';
import { UserTaskRescheduledEvent } from '@contexts/user-tasks/domain/events/user-task-rescheduled/user-task-rescheduled.event';
import { UserTaskNotCancellableException } from '@contexts/user-tasks/domain/exceptions/user-task-not-cancellable.exception';
import { UserTaskNotCompletableException } from '@contexts/user-tasks/domain/exceptions/user-task-not-completable.exception';
import { UserTaskNotReschedulableException } from '@contexts/user-tasks/domain/exceptions/user-task-not-reschedulable.exception';

import { UserTaskBuilder } from '../builders/user-task.builder';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const TASK_ID = '550e8400-e29b-41d4-a716-446655440002';
const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440003';
const TODAY = new Date('2024-06-10T00:00:00.000Z');
const YESTERDAY = new Date('2024-06-09T00:00:00.000Z');
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

describe('UserTaskAggregate — create()', () => {
  it('emits UserTaskCreatedEvent', () => {
    const task = buildTask();
    task.create();
    const events = task.getUncommittedEvents();
    expect(events.some((e) => e instanceof UserTaskCreatedEvent)).toBe(true);
  });

  it('starts as PENDING', () => {
    const task = buildTask();
    expect(task.status.value).toBe(UserTaskStatusEnum.PENDING);
  });
});

describe('UserTaskAggregate — complete()', () => {
  it('transitions to COMPLETED when scheduledDate <= today', () => {
    const task = buildTask(YESTERDAY);
    task.complete(TODAY);
    expect(task.status.value).toBe(UserTaskStatusEnum.COMPLETED);
    expect(task.completedAt).not.toBeNull();
  });

  it('emits UserTaskCompletedEvent', () => {
    const task = buildTask(YESTERDAY);
    task.complete(TODAY);
    const events = task.getUncommittedEvents();
    expect(events.some((e) => e instanceof UserTaskCompletedEvent)).toBe(true);
  });

  it('throws UserTaskNotCompletableException for future-dated task', () => {
    const task = buildTask(TOMORROW);
    expect(() => task.complete(TODAY)).toThrow(UserTaskNotCompletableException);
  });

  it('throws when task is already completed', () => {
    const task = buildTask(YESTERDAY);
    task.complete(TODAY);
    expect(() => task.complete(TODAY)).toThrow();
  });

  it('throws when task is cancelled', () => {
    const task = buildTask(YESTERDAY);
    task.cancel();
    expect(() => task.complete(TODAY)).toThrow();
  });
});

describe('UserTaskAggregate — cancel()', () => {
  it('transitions to CANCELLED from PENDING', () => {
    const task = buildTask();
    task.cancel();
    expect(task.status.value).toBe(UserTaskStatusEnum.CANCELLED);
  });

  it('emits UserTaskCancelledEvent', () => {
    const task = buildTask();
    task.cancel();
    const events = task.getUncommittedEvents();
    expect(events.some((e) => e instanceof UserTaskCancelledEvent)).toBe(true);
  });

  it('throws UserTaskNotCancellableException when already completed', () => {
    const task = buildTask(YESTERDAY);
    task.complete(TODAY);
    expect(() => task.cancel()).toThrow(UserTaskNotCancellableException);
  });

  it('throws when already cancelled', () => {
    const task = buildTask();
    task.cancel();
    expect(() => task.cancel()).toThrow(UserTaskNotCancellableException);
  });
});

describe('UserTaskAggregate — reschedule()', () => {
  it('updates scheduledDate when PENDING', () => {
    const task = buildTask(YESTERDAY);
    task.reschedule(TOMORROW);
    expect(task.scheduledDate.value).toEqual(TOMORROW);
  });

  it('emits UserTaskRescheduledEvent', () => {
    const task = buildTask(YESTERDAY);
    task.reschedule(TOMORROW);
    const events = task.getUncommittedEvents();
    expect(events.some((e) => e instanceof UserTaskRescheduledEvent)).toBe(
      true,
    );
  });

  it('throws UserTaskNotReschedulableException when completed', () => {
    const task = buildTask(YESTERDAY);
    task.complete(TODAY);
    expect(() => task.reschedule(TOMORROW)).toThrow(
      UserTaskNotReschedulableException,
    );
  });

  it('throws when cancelled', () => {
    const task = buildTask();
    task.cancel();
    expect(() => task.reschedule(TOMORROW)).toThrow(
      UserTaskNotReschedulableException,
    );
  });
});

describe('UserTaskAggregate — toPrimitives()', () => {
  it('returns correct primitives including null fields', () => {
    const task = buildTask(YESTERDAY, null);
    const primitives = task.toPrimitives();
    expect(primitives.id).toBe(TASK_ID);
    expect(primitives.title).toBe('Buy groceries');
    expect(primitives.status).toBe(UserTaskStatusEnum.PENDING);
    expect(primitives.taskTemplateId).toBeNull();
    expect(primitives.completedAt).toBeNull();
  });

  it('includes taskTemplateId when set', () => {
    const task = buildTask(YESTERDAY, TEMPLATE_ID);
    expect(task.toPrimitives().taskTemplateId).toBe(TEMPLATE_ID);
  });
});
