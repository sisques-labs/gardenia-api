import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { INotificationDispatcherPort } from '@contexts/inventory/application/ports/notification-dispatcher.port';
import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryItemNameValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-name/inventory-item-name.value-object';
import { InventoryItemTypeValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-type/inventory-item-type.value-object';
import { InventoryLowStockThresholdValueObject } from '@contexts/inventory/domain/value-objects/inventory-low-stock-threshold/inventory-low-stock-threshold.value-object';
import { InventoryQuantityValueObject } from '@contexts/inventory/domain/value-objects/inventory-quantity/inventory-quantity.value-object';
import { InventoryUnitValueObject } from '@contexts/inventory/domain/value-objects/inventory-unit/inventory-unit.value-object';
import { DispatchInventoryLowStockNotificationService } from './dispatch-inventory-low-stock-notification.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

function buildItem(
  quantity: number,
  lowStockThreshold: number | null,
): InventoryItemAggregate {
  return new InventoryItemAggregate({
    id: new InventoryItemIdValueObject(ID),
    itemType: new InventoryItemTypeValueObject(InventoryItemTypeEnum.SEEDS),
    name: new InventoryItemNameValueObject('Lettuce seeds'),
    brand: null,
    notes: null,
    quantity: new InventoryQuantityValueObject(quantity),
    unit: new InventoryUnitValueObject(InventoryUnitEnum.PACKETS),
    lowStockThreshold:
      lowStockThreshold !== null
        ? new InventoryLowStockThresholdValueObject(lowStockThreshold)
        : null,
    acquiredAt: null,
    expiresAt: null,
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('DispatchInventoryLowStockNotificationService', () => {
  let mockNotificationDispatcherPort: jest.Mocked<INotificationDispatcherPort>;
  let service: DispatchInventoryLowStockNotificationService;

  beforeEach(() => {
    mockNotificationDispatcherPort = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<INotificationDispatcherPort>;

    service = new DispatchInventoryLowStockNotificationService(
      mockNotificationDispatcherPort,
    );
  });

  it('computes active from isLowStock() when active is not given', async () => {
    const item = buildItem(2, 5);

    await service.dispatch(item);

    expect(mockNotificationDispatcherPort.dispatch).toHaveBeenCalledWith({
      condition: InventoryNotificationConditionEnum.LOW_STOCK,
      referenceId: ID,
      payload: {
        itemName: 'Lettuce seeds',
        itemType: InventoryItemTypeEnum.SEEDS,
        quantity: 2,
        unit: InventoryUnitEnum.PACKETS,
        lowStockThreshold: 5,
      },
      active: true,
    });
  });

  it('dispatches active:false when quantity is above the threshold', async () => {
    const item = buildItem(10, 5);

    await service.dispatch(item);

    expect(mockNotificationDispatcherPort.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
  });

  it('uses the explicit active flag instead of computing it, when given', async () => {
    const item = buildItem(2, 5);

    await service.dispatch(item, false);

    expect(mockNotificationDispatcherPort.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
  });
});
