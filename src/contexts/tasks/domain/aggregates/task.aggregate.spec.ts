import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { TaskCancelledEvent } from '@contexts/tasks/domain/events/task-cancelled/task-cancelled.event';
import { TaskCompletedEvent } from '@contexts/tasks/domain/events/task-completed/task-completed.event';
import { TaskFailedEvent } from '@contexts/tasks/domain/events/task-failed/task-failed.event';
import { TaskScheduledEvent } from '@contexts/tasks/domain/events/task-scheduled/task-scheduled.event';
import { TaskStartedEvent } from '@contexts/tasks/domain/events/task-started/task-started.event';
import { TaskNotCancellableException } from '@contexts/tasks/domain/exceptions/task-not-cancellable.exception';

const TASK_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440002';
const USER_ID = '550e8400-e29b-41d4-a716-446655440003';
const DATE = new Date('2024-01-01T00:00:00.000Z');

const buildTask = (status = TaskStatusEnum.PENDING): TaskAggregate =>
  new TaskBuilder()
    .withId(TASK_ID)
    .withTemplateId(TEMPLATE_ID)
    .withUserId(USER_ID)
    .withStatus(status)
    .withCreatedAt(DATE)
    .withUpdatedAt(DATE)
    .build();

describe('TaskAggregate', () => {
  describe('constructor — hydration', () => {
    it('constructs with matching field values', () => {
      const task = buildTask();

      expect(task.id.value).toBe(TASK_ID);
      expect(task.templateId.value).toBe(TEMPLATE_ID);
      expect(task.userId.value).toBe(USER_ID);
      expect(task.status.value).toBe(TaskStatusEnum.PENDING);
    });

    it('has no uncommitted events after construction', () => {
      const task = buildTask();
      expect(task.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('schedule()', () => {
    it('emits a TaskScheduledEvent', () => {
      const task = buildTask();
      task.schedule();
      const events = task.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TaskScheduledEvent);
    });

    it('sets scheduledAt', () => {
      const task = buildTask();
      task.schedule();
      expect(task.scheduledAt).not.toBeNull();
    });

    it('emits event with correct aggregate metadata', () => {
      const task = buildTask();
      task.schedule();
      const event = task.getUncommittedEvents()[0] as TaskScheduledEvent;

      expect(event.aggregateRootId).toBe(TASK_ID);
      expect(event.aggregateRootType).toBe(TaskAggregate.name);
    });
  });

  describe('start()', () => {
    it('transitions PENDING → ACTIVE', () => {
      const task = buildTask(TaskStatusEnum.PENDING);
      task.start();
      expect(task.status.value).toBe(TaskStatusEnum.ACTIVE);
    });

    it('sets startedAt', () => {
      const task = buildTask();
      task.start();
      expect(task.startedAt).not.toBeNull();
    });

    it('increments runCount', () => {
      const task = buildTask();
      expect(task.runCount.value).toBe(0);
      task.start();
      expect(task.runCount.value).toBe(1);
    });

    it('emits TaskStartedEvent', () => {
      const task = buildTask();
      task.start();
      const events = task.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TaskStartedEvent);
    });

    it('does not overwrite COMPLETED status — transition guard (regression #159)', () => {
      const task = buildTask(TaskStatusEnum.COMPLETED);
      task.start();

      expect(task.status.value).toBe(TaskStatusEnum.COMPLETED);
      expect(task.getUncommittedEvents()).toHaveLength(0);
    });

    it('does not overwrite FAILED status — transition guard', () => {
      const task = buildTask(TaskStatusEnum.FAILED);
      task.start();

      expect(task.status.value).toBe(TaskStatusEnum.FAILED);
      expect(task.getUncommittedEvents()).toHaveLength(0);
    });

    it('does not overwrite CANCELLED status — transition guard', () => {
      const task = buildTask(TaskStatusEnum.CANCELLED);
      task.start();

      expect(task.status.value).toBe(TaskStatusEnum.CANCELLED);
      expect(task.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('complete()', () => {
    it('transitions ACTIVE → COMPLETED', () => {
      const task = buildTask(TaskStatusEnum.ACTIVE);
      task.complete();
      expect(task.status.value).toBe(TaskStatusEnum.COMPLETED);
    });

    it('transitions PENDING → COMPLETED', () => {
      const task = buildTask(TaskStatusEnum.PENDING);
      task.complete();
      expect(task.status.value).toBe(TaskStatusEnum.COMPLETED);
    });

    it('sets completedAt', () => {
      const task = buildTask(TaskStatusEnum.ACTIVE);
      task.complete();
      expect(task.completedAt).not.toBeNull();
    });

    it('emits TaskCompletedEvent', () => {
      const task = buildTask(TaskStatusEnum.ACTIVE);
      task.complete();
      const events = task.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TaskCompletedEvent);
    });

    it('does not overwrite COMPLETED — idempotency guard', () => {
      const task = buildTask(TaskStatusEnum.COMPLETED);
      task.complete();

      expect(task.status.value).toBe(TaskStatusEnum.COMPLETED);
      expect(task.getUncommittedEvents()).toHaveLength(0);
    });

    it('does not overwrite FAILED — transition guard', () => {
      const task = buildTask(TaskStatusEnum.FAILED);
      task.complete();

      expect(task.status.value).toBe(TaskStatusEnum.FAILED);
      expect(task.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('fail()', () => {
    it('transitions ACTIVE → FAILED', () => {
      const task = buildTask(TaskStatusEnum.ACTIVE);
      task.fail('timeout');
      expect(task.status.value).toBe(TaskStatusEnum.FAILED);
    });

    it('sets failedAt', () => {
      const task = buildTask(TaskStatusEnum.ACTIVE);
      task.fail('timeout');
      expect(task.failedAt).not.toBeNull();
    });

    it('emits TaskFailedEvent', () => {
      const task = buildTask(TaskStatusEnum.ACTIVE);
      task.fail('timeout');
      const events = task.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TaskFailedEvent);
    });

    it('does not overwrite COMPLETED — transition guard', () => {
      const task = buildTask(TaskStatusEnum.COMPLETED);
      task.fail('late error');

      expect(task.status.value).toBe(TaskStatusEnum.COMPLETED);
      expect(task.getUncommittedEvents()).toHaveLength(0);
    });

    it('does not overwrite FAILED — idempotency guard', () => {
      const task = buildTask(TaskStatusEnum.FAILED);
      task.fail('duplicate error');

      expect(task.status.value).toBe(TaskStatusEnum.FAILED);
      expect(task.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('cancel()', () => {
    it('transitions PENDING → CANCELLED', () => {
      const task = buildTask(TaskStatusEnum.PENDING);
      task.cancel();
      expect(task.status.value).toBe(TaskStatusEnum.CANCELLED);
    });

    it('sets cancelledAt', () => {
      const task = buildTask(TaskStatusEnum.PENDING);
      task.cancel();
      expect(task.cancelledAt).not.toBeNull();
    });

    it('emits TaskCancelledEvent', () => {
      const task = buildTask(TaskStatusEnum.PENDING);
      task.cancel();
      const events = task.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TaskCancelledEvent);
    });

    it('throws TaskNotCancellableException when status is ACTIVE', () => {
      const task = buildTask(TaskStatusEnum.ACTIVE);
      expect(() => task.cancel()).toThrow(TaskNotCancellableException);
    });

    it('throws TaskNotCancellableException when status is COMPLETED', () => {
      const task = buildTask(TaskStatusEnum.COMPLETED);
      expect(() => task.cancel()).toThrow(TaskNotCancellableException);
    });
  });

  describe('race condition — completed before started (regression #159)', () => {
    it('task stays COMPLETED when start() is called after complete()', () => {
      const task = buildTask(TaskStatusEnum.PENDING);

      task.complete();
      expect(task.status.value).toBe(TaskStatusEnum.COMPLETED);

      task.start();
      expect(task.status.value).toBe(TaskStatusEnum.COMPLETED);
    });
  });

  describe('toPrimitives()', () => {
    it('returns primitives matching construction values', () => {
      const task = buildTask();
      const primitives = task.toPrimitives();

      expect(primitives.id).toBe(TASK_ID);
      expect(primitives.templateId).toBe(TEMPLATE_ID);
      expect(primitives.userId).toBe(USER_ID);
      expect(primitives.status).toBe(TaskStatusEnum.PENDING);
      expect(primitives.runCount).toBe(0);
      expect(primitives.createdAt).toEqual(DATE);
    });
  });
});
