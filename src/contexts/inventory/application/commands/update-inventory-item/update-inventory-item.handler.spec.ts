import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { AssertInventoryItemExistsService } from '@contexts/inventory/application/services/write/assert-inventory-item-exists/assert-inventory-item-exists.service';
import { DispatchInventoryExpiringSoonNotificationService } from '@contexts/inventory/application/services/write/dispatch-inventory-expiring-soon-notification/dispatch-inventory-expiring-soon-notification.service';
import { DispatchInventoryLowStockNotificationService } from '@contexts/inventory/application/services/write/dispatch-inventory-low-stock-notification/dispatch-inventory-low-stock-notification.service';
import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemNotFoundException } from '@contexts/inventory/domain/exceptions/inventory-item-not-found.exception';
import { IInventoryItemWriteRepository } from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryItemNameValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-name/inventory-item-name.value-object';
import { InventoryItemTypeValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-type/inventory-item-type.value-object';
import { InventoryQuantityValueObject } from '@contexts/inventory/domain/value-objects/inventory-quantity/inventory-quantity.value-object';
import { InventoryUnitValueObject } from '@contexts/inventory/domain/value-objects/inventory-unit/inventory-unit.value-object';
import { UpdateInventoryItemCommand } from './update-inventory-item.command';
import { UpdateInventoryItemCommandHandler } from './update-inventory-item.handler';

const ID = '550e8400-e29b-41d4-a716-446655440000';

function buildItem(): InventoryItemAggregate {
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
    expiresAt: null,
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('UpdateInventoryItemCommandHandler', () => {
  let handler: UpdateInventoryItemCommandHandler;
  let mockWriteRepo: jest.Mocked<IInventoryItemWriteRepository>;
  let mockAssert: jest.Mocked<AssertInventoryItemExistsService>;
  let mockDispatchInventoryLowStockNotificationService: jest.Mocked<DispatchInventoryLowStockNotificationService>;
  let mockDispatchInventoryExpiringSoonNotificationService: jest.Mocked<DispatchInventoryExpiringSoonNotificationService>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IInventoryItemWriteRepository>;

    mockAssert = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertInventoryItemExistsService>;

    mockDispatchInventoryLowStockNotificationService = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<DispatchInventoryLowStockNotificationService>;

    mockDispatchInventoryExpiringSoonNotificationService = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<DispatchInventoryExpiringSoonNotificationService>;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new UpdateInventoryItemCommandHandler(
      mockWriteRepo,
      mockAssert,
      mockDispatchInventoryLowStockNotificationService,
      mockDispatchInventoryExpiringSoonNotificationService,
      mockEventBus,
    );
  });

  it('updates fields and saves', async () => {
    const item = buildItem();
    mockAssert.execute.mockResolvedValue(item);

    await handler.execute(
      new UpdateInventoryItemCommand({ id: ID, name: 'Tomato seeds' }),
    );

    expect(item.name.value).toBe('Tomato seeds');
    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
  });

  it('clears an optional field when set to null', async () => {
    const item = buildItem();
    mockAssert.execute.mockResolvedValue(item);

    await handler.execute(
      new UpdateInventoryItemCommand({ id: ID, notes: null }),
    );

    expect(item.notes).toBeNull();
  });

  it('propagates not found', async () => {
    mockAssert.execute.mockRejectedValue(
      new InventoryItemNotFoundException(ID),
    );

    await expect(
      handler.execute(new UpdateInventoryItemCommand({ id: ID, name: 'x' })),
    ).rejects.toBeInstanceOf(InventoryItemNotFoundException);
  });

  it('dispatches both LOW_STOCK and EXPIRING_SOON status via their services after updating', async () => {
    const item = buildItem();
    mockAssert.execute.mockResolvedValue(item);

    await handler.execute(
      new UpdateInventoryItemCommand({
        id: ID,
        lowStockThreshold: 10,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    );

    expect(
      mockDispatchInventoryLowStockNotificationService.dispatch,
    ).toHaveBeenCalledWith(item);
    expect(
      mockDispatchInventoryExpiringSoonNotificationService.dispatch,
    ).toHaveBeenCalledWith(item);
  });
});
