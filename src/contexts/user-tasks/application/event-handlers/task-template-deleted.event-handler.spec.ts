import { TaskTemplateDeletedEvent } from '@contexts/tasks/domain/events/task-template-deleted/task-template-deleted.event';
import { TaskTemplateDeletedEventHandler } from './task-template-deleted.event-handler';

const TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('TaskTemplateDeletedEventHandler (user-tasks context)', () => {
  let handler: TaskTemplateDeletedEventHandler;
  let mockWriteRepo: {
    deleteByTemplateId: jest.Mock;
    save: jest.Mock;
    findById: jest.Mock;
    findByCriteria: jest.Mock;
    delete: jest.Mock;
    saveMany: jest.Mock;
  };

  beforeEach(() => {
    mockWriteRepo = {
      deleteByTemplateId: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
      saveMany: jest.fn(),
    };

    handler = new TaskTemplateDeletedEventHandler(mockWriteRepo as any);
  });

  it('calls deleteByTemplateId with the correct templateId', async () => {
    const event = new TaskTemplateDeletedEvent(
      {
        aggregateRootId: TEMPLATE_ID,
        aggregateRootType: 'TaskTemplateAggregate',
        entityId: TEMPLATE_ID,
        entityType: 'TaskTemplateAggregate',
        eventType: TaskTemplateDeletedEvent.name,
      },
      { taskTemplateId: TEMPLATE_ID },
    );

    await handler.handle(event);

    expect(mockWriteRepo.deleteByTemplateId).toHaveBeenCalledWith(TEMPLATE_ID);
  });
});
