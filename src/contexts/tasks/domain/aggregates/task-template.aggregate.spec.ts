import { TaskTemplateBuilder } from '@contexts/tasks/domain/builders/task-template.builder';
import { TaskTemplateHandlerKeyRequiredException } from '@contexts/tasks/domain/exceptions/task-template-handler-key-required.exception';
import { TaskTemplateDeletedEvent } from '@contexts/tasks/domain/events/task-template-deleted/task-template-deleted.event';
import { TaskTemplateAggregate } from './task-template.aggregate';

const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const DATE = new Date('2024-01-01T00:00:00.000Z');

const buildTemplate = (handlerKey: string | null = 'water-plant') =>
  new TaskTemplateBuilder()
    .withId(TEMPLATE_ID)
    .withName('water-plant')
    .withHandlerKey(handlerKey)
    .withUserId(USER_ID)
    .withCreatedAt(DATE)
    .withUpdatedAt(DATE)
    .build();

describe('TaskTemplateAggregate — nullable handlerKey', () => {
  it('builds successfully with a null handlerKey', () => {
    const template = buildTemplate(null);
    expect(template).toBeInstanceOf(TaskTemplateAggregate);
    expect(template.handlerKey).toBeNull();
    expect(template.toPrimitives().handlerKey).toBeNull();
  });

  it('builds successfully with a non-null handlerKey', () => {
    const template = buildTemplate('water-plant');
    expect(template.handlerKey?.value).toBe('water-plant');
    expect(template.toPrimitives().handlerKey).toBe('water-plant');
  });
});

describe('TaskTemplateAggregate — delete', () => {
  it('delete() emits a TaskTemplateDeletedEvent', () => {
    const template = buildTemplate('water-plant');
    template.delete();
    const events = template.getUncommittedEvents();
    expect(events.some((e) => e instanceof TaskTemplateDeletedEvent)).toBe(
      true,
    );
  });

  it('TaskTemplateDeletedEvent carries the template id', () => {
    const template = buildTemplate(null);
    template.delete();
    const evt = template
      .getUncommittedEvents()
      .find(
        (e) => e instanceof TaskTemplateDeletedEvent,
      ) as TaskTemplateDeletedEvent;
    expect(evt.data.taskTemplateId).toBe(TEMPLATE_ID);
  });
});

describe('TaskTemplateAggregate — taskTitle and taskDescription', () => {
  it('builds with null taskTitle and taskDescription by default', () => {
    const template = buildTemplate(null);
    expect(template.taskTitle).toBeNull();
    expect(template.taskDescription).toBeNull();
  });

  it('stores taskTitle from builder', () => {
    const template = new TaskTemplateBuilder()
      .withId(TEMPLATE_ID)
      .withName('morning-routine')
      .withTaskTitle('Morning Routine')
      .withTaskDescription('Complete all morning tasks')
      .withUserId(USER_ID)
      .withCreatedAt(DATE)
      .withUpdatedAt(DATE)
      .build();

    expect(template.taskTitle?.value).toBe('Morning Routine');
    expect(template.taskDescription?.value).toBe('Complete all morning tasks');
  });

  it('exposes taskTitle and taskDescription in toPrimitives()', () => {
    const template = new TaskTemplateBuilder()
      .withId(TEMPLATE_ID)
      .withName('morning-routine')
      .withTaskTitle('Morning Routine')
      .withUserId(USER_ID)
      .withCreatedAt(DATE)
      .withUpdatedAt(DATE)
      .build();

    const primitives = template.toPrimitives();
    expect(primitives.taskTitle).toBe('Morning Routine');
    expect(primitives.taskDescription).toBeNull();
  });
});

describe('TaskTemplateHandlerKeyRequiredException', () => {
  it('is constructable', () => {
    const err = new TaskTemplateHandlerKeyRequiredException(TEMPLATE_ID);
    expect(err.message).toContain(TEMPLATE_ID);
  });
});
