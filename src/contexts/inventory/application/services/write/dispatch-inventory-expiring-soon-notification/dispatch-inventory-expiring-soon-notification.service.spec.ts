import { ConfigService } from '@nestjs/config';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { INotificationDispatcherPort } from '@contexts/inventory/application/ports/notification-dispatcher.port';
import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryNotificationConditionEnum } from '@contexts/inventory/domain/enums/inventory-notification-condition.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryExpiresAtValueObject } from '@contexts/inventory/domain/value-objects/inventory-expires-at/inventory-expires-at.value-object';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryItemNameValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-name/inventory-item-name.value-object';
import { InventoryItemTypeValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-type/inventory-item-type.value-object';
import { InventoryQuantityValueObject } from '@contexts/inventory/domain/value-objects/inventory-quantity/inventory-quantity.value-object';
import { InventoryUnitValueObject } from '@contexts/inventory/domain/value-objects/inventory-unit/inventory-unit.value-object';
import { DispatchInventoryExpiringSoonNotificationService } from './dispatch-inventory-expiring-soon-notification.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

function buildItem(expiresAt: Date | null): InventoryItemAggregate {
  return new InventoryItemAggregate({
    id: new InventoryItemIdValueObject(ID),
    itemType: new InventoryItemTypeValueObject(InventoryItemTypeEnum.SEEDS),
    name: new InventoryItemNameValueObject('Lettuce seeds'),
    brand: null,
    notes: null,
    quantity: new InventoryQuantityValueObject(5),
    unit: new InventoryUnitValueObject(InventoryUnitEnum.PACKETS),
    lowStockThreshold: null,
    acquiredAt: null,
    expiresAt:
      expiresAt !== null ? new InventoryExpiresAtValueObject(expiresAt) : null,
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('DispatchInventoryExpiringSoonNotificationService', () => {
  let mockNotificationDispatcherPort: jest.Mocked<INotificationDispatcherPort>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let service: DispatchInventoryExpiringSoonNotificationService;

  beforeEach(() => {
    mockNotificationDispatcherPort = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<INotificationDispatcherPort>;

    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue({ expiringWindowDays: 7 }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new DispatchInventoryExpiringSoonNotificationService(
      mockNotificationDispatcherPort,
      mockConfigService,
    );
  });

  it('computes active from isExpiringWithin(expiringWindowDays) when active is not given', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const item = buildItem(expiresAt);

    await service.dispatch(item);

    expect(mockNotificationDispatcherPort.dispatch).toHaveBeenCalledWith({
      condition: InventoryNotificationConditionEnum.EXPIRING_SOON,
      referenceId: ID,
      payload: {
        itemName: 'Lettuce seeds',
        itemType: InventoryItemTypeEnum.SEEDS,
        expiresAt,
      },
      active: true,
    });
  });

  it('dispatches active:false when the item has no expiresAt', async () => {
    const item = buildItem(null);

    await service.dispatch(item);

    expect(mockNotificationDispatcherPort.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
  });

  it('uses the explicit active flag instead of computing it, when given', async () => {
    const item = buildItem(new Date(Date.now() + 24 * 60 * 60 * 1000));

    await service.dispatch(item, false);

    expect(mockConfigService.getOrThrow).not.toHaveBeenCalled();
    expect(mockNotificationDispatcherPort.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
  });
});
