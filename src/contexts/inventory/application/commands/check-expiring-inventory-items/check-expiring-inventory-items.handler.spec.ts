import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
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
  let inventoryItemReadRepository: { findByCriteria: jest.Mock };
  let notificationDispatcherPort: { dispatch: jest.Mock };
  let handler: CheckExpiringInventoryItemsCommandHandler;

  beforeEach(() => {
    inventoryItemReadRepository = { findByCriteria: jest.fn() };
    notificationDispatcherPort = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };

    handler = new CheckExpiringInventoryItemsCommandHandler(
      inventoryItemReadRepository as any,
      notificationDispatcherPort as any,
    );
  });

  it('dispatches active:true for every expiring item found', async () => {
    const item = buildExpiringItem('990e8400-e29b-41d4-a716-446655440010');
    inventoryItemReadRepository.findByCriteria.mockResolvedValue(
      new PaginatedResult([item], 1, 1, 100),
    );

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
    inventoryItemReadRepository.findByCriteria.mockResolvedValue(
      new PaginatedResult([], 0, 1, 100),
    );

    await handler.execute(
      new CheckExpiringInventoryItemsCommand({ windowDays: 7 }),
    );

    expect(notificationDispatcherPort.dispatch).not.toHaveBeenCalled();
  });
});
