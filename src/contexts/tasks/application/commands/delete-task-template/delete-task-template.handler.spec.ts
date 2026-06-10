import { EventBus } from '@nestjs/cqrs';

import { AssertTaskTemplateExistsService } from '@contexts/tasks/application/services/write/assert-task-template-exists/assert-task-template-exists.service';
import { TaskTemplateBuilder } from '@contexts/tasks/domain/builders/task-template.builder';
import { TaskTemplateDeletedEvent } from '@contexts/tasks/domain/events/task-template-deleted/task-template-deleted.event';
import { TaskTemplateNotFoundException } from '@contexts/tasks/domain/exceptions/task-template-not-found.exception';
import { ITaskTemplateWriteRepository } from '@contexts/tasks/domain/repositories/write/task-template-write.repository';

import { DeleteTaskTemplateCommand } from './delete-task-template.command';
import { DeleteTaskTemplateCommandHandler } from './delete-task-template.handler';

const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const DATE = new Date('2024-01-01T00:00:00.000Z');

const buildTemplate = () =>
  new TaskTemplateBuilder()
    .withId(TEMPLATE_ID)
    .withName('water-plant')
    .withHandlerKey('water-plant')
    .withUserId(USER_ID)
    .withCreatedAt(DATE)
    .withUpdatedAt(DATE)
    .build();

describe('DeleteTaskTemplateCommandHandler', () => {
  let handler: DeleteTaskTemplateCommandHandler;
  let writeRepo: jest.Mocked<ITaskTemplateWriteRepository>;
  let assertService: jest.Mocked<AssertTaskTemplateExistsService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    writeRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ITaskTemplateWriteRepository>;

    assertService = {
      execute: jest.fn().mockResolvedValue(buildTemplate()),
    } as unknown as jest.Mocked<AssertTaskTemplateExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new DeleteTaskTemplateCommandHandler(
      writeRepo,
      assertService,
      eventBus,
    );
  });

  it('loads the template via AssertTaskTemplateExistsService', async () => {
    await handler.execute(new DeleteTaskTemplateCommand({ id: TEMPLATE_ID }));
    expect(assertService.execute).toHaveBeenCalledWith(TEMPLATE_ID);
  });

  it('calls delete on the write repository', async () => {
    await handler.execute(new DeleteTaskTemplateCommand({ id: TEMPLATE_ID }));
    expect(writeRepo.delete).toHaveBeenCalledWith(TEMPLATE_ID);
  });

  it('publishes events (including TaskTemplateDeletedEvent) after deleting', async () => {
    const capturedEvents: unknown[][] = [];
    (eventBus.publishAll as jest.Mock).mockImplementation(
      (events: unknown[]) => {
        capturedEvents.push([...events]); // snapshot before commit() clears the array
        return Promise.resolve();
      },
    );

    await handler.execute(new DeleteTaskTemplateCommand({ id: TEMPLATE_ID }));

    expect(capturedEvents.length).toBeGreaterThan(0);
    const allEvents = capturedEvents.flat();
    expect(allEvents.some((e) => e instanceof TaskTemplateDeletedEvent)).toBe(
      true,
    );
    const evt = allEvents.find(
      (e) => e instanceof TaskTemplateDeletedEvent,
    ) as TaskTemplateDeletedEvent;
    expect(evt.data.taskTemplateId).toBe(TEMPLATE_ID);
  });

  it('throws TaskTemplateNotFoundException when template does not exist', async () => {
    assertService.execute.mockRejectedValue(
      new TaskTemplateNotFoundException(TEMPLATE_ID),
    );
    await expect(
      handler.execute(new DeleteTaskTemplateCommand({ id: TEMPLATE_ID })),
    ).rejects.toThrow(TaskTemplateNotFoundException);
    expect(writeRepo.delete).not.toHaveBeenCalled();
  });
});
