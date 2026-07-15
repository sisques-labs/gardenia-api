import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationIdValueObject } from '@contexts/notifications/domain/value-objects/notification-id/notification-id.value-object';
import { NotificationPayloadValueObject } from '@contexts/notifications/domain/value-objects/notification-payload/notification-payload.value-object';
import { NotificationReferenceTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-reference-type/notification-reference-type.value-object';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationStatusValueObject } from '@contexts/notifications/domain/value-objects/notification-status/notification-status.value-object';
import { NotificationTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-type/notification-type.value-object';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { INotificationWriteRepository } from '@contexts/notifications/domain/repositories/write/notification-write.repository';
import { ResolveNotificationsService } from './resolve-notifications.service';

const REFERENCE_ID = '990e8400-e29b-41d4-a716-446655440010';
const USER_ID = '770e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '880e8400-e29b-41d4-a716-446655440003';

function buildOpenAggregate(id: string): NotificationAggregate {
  const now = new Date();
  return new NotificationAggregate({
    id: new NotificationIdValueObject(id),
    type: new NotificationTypeValueObject('INVENTORY_LOW_STOCK'),
    referenceType: new NotificationReferenceTypeValueObject('INVENTORY_ITEM'),
    referenceId: new UuidValueObject(REFERENCE_ID),
    dedupeKey: new NotificationDedupeKeyValueObject(
      NotificationDedupeKeyValueObject.compute(
        'INVENTORY_LOW_STOCK',
        REFERENCE_ID,
      ),
    ),
    payload: new NotificationPayloadValueObject({}),
    status: new NotificationStatusValueObject(NotificationStatusEnum.UNREAD),
    readAt: null,
    resolvedAt: null,
    userId: new UuidValueObject(USER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    createdAt: new DateValueObject(now),
    updatedAt: new DateValueObject(now),
  });
}

describe('ResolveNotificationsService', () => {
  let mockNotificationWriteRepository: jest.Mocked<INotificationWriteRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let service: ResolveNotificationsService;

  beforeEach(() => {
    mockNotificationWriteRepository = {
      findById: jest.fn(),
      saveMany: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<INotificationWriteRepository>;

    mockEventBus = {
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    service = new ResolveNotificationsService(
      mockNotificationWriteRepository,
      mockEventBus,
    );
  });

  it('resolves every open notification and saves them', async () => {
    const aggregate = buildOpenAggregate(
      'aa0e8400-e29b-41d4-a716-446655440011',
    );
    mockNotificationWriteRepository.findById.mockResolvedValue(aggregate);

    await service.execute({
      open: [{ id: 'aa0e8400-e29b-41d4-a716-446655440011' }],
      dedupeKey: 'INVENTORY_LOW_STOCK:some-id',
    });

    expect(aggregate.resolvedAt).not.toBeNull();
    expect(mockNotificationWriteRepository.saveMany).toHaveBeenCalledWith([
      aggregate,
    ]);
    expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the open list is empty', async () => {
    await service.execute({ open: [], dedupeKey: 'x' });

    expect(mockNotificationWriteRepository.findById).not.toHaveBeenCalled();
    expect(mockNotificationWriteRepository.saveMany).not.toHaveBeenCalled();
  });

  it('skips ids that no longer resolve to an aggregate', async () => {
    mockNotificationWriteRepository.findById.mockResolvedValue(null);

    await service.execute({
      open: [{ id: 'aa0e8400-e29b-41d4-a716-446655440011' }],
      dedupeKey: 'x',
    });

    expect(mockNotificationWriteRepository.saveMany).toHaveBeenCalledWith([]);
  });
});
