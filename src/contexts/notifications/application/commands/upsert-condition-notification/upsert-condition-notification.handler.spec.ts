import { OpenNotificationService } from '@contexts/notifications/application/services/write/open-notification/open-notification.service';
import { ResolveNotificationsService } from '@contexts/notifications/application/services/write/resolve-notifications/resolve-notifications.service';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { UpsertConditionNotificationCommand } from './upsert-condition-notification.command';
import { UpsertConditionNotificationCommandHandler } from './upsert-condition-notification.handler';

const SPACE_ID = '880e8400-e29b-41d4-a716-446655440003';
const REFERENCE_ID = '990e8400-e29b-41d4-a716-446655440010';
const NOTIFICATION_ID = 'aa0e8400-e29b-41d4-a716-446655440011';

describe('UpsertConditionNotificationCommandHandler', () => {
  let notificationReadRepository: { findOpenByDedupeKey: jest.Mock };
  let mockOpenNotificationService: jest.Mocked<OpenNotificationService>;
  let mockResolveNotificationsService: jest.Mocked<ResolveNotificationsService>;
  let spaceContext: { require: jest.Mock };
  let handler: UpsertConditionNotificationCommandHandler;

  beforeEach(() => {
    notificationReadRepository = {
      findOpenByDedupeKey: jest.fn().mockResolvedValue([]),
    };
    mockOpenNotificationService = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OpenNotificationService>;
    mockResolveNotificationsService = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ResolveNotificationsService>;
    spaceContext = { require: jest.fn().mockReturnValue(SPACE_ID) };

    handler = new UpsertConditionNotificationCommandHandler(
      notificationReadRepository as any,
      mockOpenNotificationService,
      mockResolveNotificationsService,
      spaceContext as unknown as SpaceContext,
    );
  });

  it('opens a notification when active and none is open for that dedupeKey', async () => {
    await handler.execute(
      new UpsertConditionNotificationCommand({
        type: 'INVENTORY_LOW_STOCK',
        referenceType: 'INVENTORY_ITEM',
        referenceId: REFERENCE_ID,
        payload: { itemName: 'Compost' },
        active: true,
      }),
    );

    expect(mockOpenNotificationService.execute).toHaveBeenCalledWith({
      type: 'INVENTORY_LOW_STOCK',
      referenceType: 'INVENTORY_ITEM',
      referenceId: REFERENCE_ID,
      payload: { itemName: 'Compost' },
      spaceId: SPACE_ID,
    });
  });

  it('does nothing when active and a notification is already open for that dedupeKey', async () => {
    notificationReadRepository.findOpenByDedupeKey.mockResolvedValue([
      { id: NOTIFICATION_ID },
    ]);

    await handler.execute(
      new UpsertConditionNotificationCommand({
        type: 'INVENTORY_LOW_STOCK',
        referenceType: 'INVENTORY_ITEM',
        referenceId: REFERENCE_ID,
        payload: {},
        active: true,
      }),
    );

    expect(mockOpenNotificationService.execute).not.toHaveBeenCalled();
  });

  it('resolves every open notification for that dedupeKey when inactive', async () => {
    const open = [{ id: NOTIFICATION_ID }];
    notificationReadRepository.findOpenByDedupeKey.mockResolvedValue(open);

    await handler.execute(
      new UpsertConditionNotificationCommand({
        type: 'INVENTORY_LOW_STOCK',
        referenceType: 'INVENTORY_ITEM',
        referenceId: REFERENCE_ID,
        payload: {},
        active: false,
      }),
    );

    expect(mockResolveNotificationsService.execute).toHaveBeenCalledWith({
      open,
      dedupeKey: `INVENTORY_LOW_STOCK:${REFERENCE_ID}`,
    });
  });

  it('does nothing when inactive and nothing is open for that dedupeKey', async () => {
    await handler.execute(
      new UpsertConditionNotificationCommand({
        type: 'INVENTORY_LOW_STOCK',
        referenceType: 'INVENTORY_ITEM',
        referenceId: REFERENCE_ID,
        payload: {},
        active: false,
      }),
    );

    expect(mockResolveNotificationsService.execute).toHaveBeenCalledWith({
      open: [],
      dedupeKey: `INVENTORY_LOW_STOCK:${REFERENCE_ID}`,
    });
  });
});
