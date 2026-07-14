import { EventBus } from '@nestjs/cqrs';

import { IUserDirectoryPort } from '@contexts/notifications/application/ports/user-directory.port';
import { NotificationBuilder } from '@contexts/notifications/domain/builders/notification.builder';
import { INotificationWriteRepository } from '@contexts/notifications/domain/repositories/write/notification-write.repository';
import { OpenNotificationService } from './open-notification.service';

const REFERENCE_ID = '990e8400-e29b-41d4-a716-446655440010';
const SPACE_ID = '880e8400-e29b-41d4-a716-446655440003';
const USER_1 = '770e8400-e29b-41d4-a716-446655440001';
const USER_2 = '770e8400-e29b-41d4-a716-446655440002';

describe('OpenNotificationService', () => {
  let mockNotificationWriteRepository: jest.Mocked<INotificationWriteRepository>;
  let mockUserDirectoryPort: jest.Mocked<IUserDirectoryPort>;
  let mockEventBus: jest.Mocked<EventBus>;
  let service: OpenNotificationService;

  beforeEach(() => {
    mockNotificationWriteRepository = {
      findById: jest.fn(),
      saveMany: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<INotificationWriteRepository>;

    mockUserDirectoryPort = {
      listActiveMemberUserIds: jest.fn().mockResolvedValue([USER_1, USER_2]),
    } as jest.Mocked<IUserDirectoryPort>;

    mockEventBus = {
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    service = new OpenNotificationService(
      mockNotificationWriteRepository,
      mockUserDirectoryPort,
      new NotificationBuilder(),
      mockEventBus,
    );
  });

  it('creates one notification per active member', async () => {
    await service.execute({
      type: 'INVENTORY_LOW_STOCK',
      referenceType: 'INVENTORY_ITEM',
      referenceId: REFERENCE_ID,
      payload: { itemName: 'Compost' },
      spaceId: SPACE_ID,
    });

    expect(mockNotificationWriteRepository.saveMany).toHaveBeenCalledTimes(1);
    const saved = mockNotificationWriteRepository.saveMany.mock.calls[0][0];
    expect(saved).toHaveLength(2);
    expect(saved.map((n) => n.userId.value).sort()).toEqual(
      [USER_1, USER_2].sort(),
    );
    expect(saved.every((n) => n.type.value === 'INVENTORY_LOW_STOCK')).toBe(
      true,
    );
  });

  it('publishes the events for every created notification', async () => {
    await service.execute({
      type: 'INVENTORY_LOW_STOCK',
      referenceType: 'INVENTORY_ITEM',
      referenceId: REFERENCE_ID,
      payload: {},
      spaceId: SPACE_ID,
    });

    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(2);
  });

  it('does nothing when there are no active members', async () => {
    mockUserDirectoryPort.listActiveMemberUserIds.mockResolvedValue([]);

    await service.execute({
      type: 'INVENTORY_LOW_STOCK',
      referenceType: 'INVENTORY_ITEM',
      referenceId: REFERENCE_ID,
      payload: {},
      spaceId: SPACE_ID,
    });

    expect(mockNotificationWriteRepository.saveMany).toHaveBeenCalledWith([]);
  });
});
