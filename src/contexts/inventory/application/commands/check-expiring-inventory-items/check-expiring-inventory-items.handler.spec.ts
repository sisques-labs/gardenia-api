import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { FindAllExpiringInventoryItemsService } from '@contexts/inventory/application/services/read/find-all-expiring-inventory-items/find-all-expiring-inventory-items.service';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { CheckExpiringInventoryItemsCommand } from './check-expiring-inventory-items.command';
import { CheckExpiringInventoryItemsCommandHandler } from './check-expiring-inventory-items.handler';

function buildExpiringItem(id: string): InventoryItemViewModel {
  return new InventoryItemViewModel({
    id,
    itemType: InventoryItemTypeEnum.FERTILIZER,
    name: 'Compost',
    brand: null,
    notes: null,
    quantity: 5,
    unit: InventoryUnitEnum.KG,
    lowStockThreshold: null,
    acquiredAt: null,
    expiresAt: new Date(),
    userId: '660e8400-e29b-41d4-a716-446655440001',
    spaceId: '770e8400-e29b-41d4-a716-446655440002',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CheckExpiringInventoryItemsCommandHandler', () => {
  let mockFindAllExpiringInventoryItemsService: jest.Mocked<FindAllExpiringInventoryItemsService>;
  let notificationDispatcherPort: { dispatch: jest.Mock };
  let handler: CheckExpiringInventoryItemsCommandHandler;

  beforeEach(() => {
    mockFindAllExpiringInventoryItemsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FindAllExpiringInventoryItemsService>;
    notificationDispatcherPort = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };

    handler = new CheckExpiringInventoryItemsCommandHandler(
      mockFindAllExpiringInventoryItemsService,
      notificationDispatcherPort as any,
    );
  });

  it('dispatches active:true for every expiring item found', async () => {
    const item = buildExpiringItem('990e8400-e29b-41d4-a716-446655440010');
    mockFindAllExpiringInventoryItemsService.execute.mockResolvedValue([item]);

    await handler.execute(
      new CheckExpiringInventoryItemsCommand({ windowDays: 7 }),
    );

    expect(notificationDispatcherPort.dispatch).toHaveBeenCalledWith({
      condition: InventoryNotificationConditionEnum.EXPIRING_SOON,
      referenceId: item.id,
      payload: {
        itemName: item.name,
        itemType: item.itemType,
        expiresAt: item.expiresAt,
      },
      active: true,
    });
  });

  it('does nothing when there are no expiring items', async () => {
    mockFindAllExpiringInventoryItemsService.execute.mockResolvedValue([]);

    await handler.execute(
      new CheckExpiringInventoryItemsCommand({ windowDays: 7 }),
    );

    expect(notificationDispatcherPort.dispatch).not.toHaveBeenCalled();
  });

  it('asks the service for items expiring within the configured window', async () => {
    mockFindAllExpiringInventoryItemsService.execute.mockResolvedValue([]);

    await handler.execute(
      new CheckExpiringInventoryItemsCommand({ windowDays: 7 }),
    );

    expect(
      mockFindAllExpiringInventoryItemsService.execute,
    ).toHaveBeenCalledWith({ expiringBefore: expect.any(Date) });
  });
});
