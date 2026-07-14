import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { AssertInventoryItemExistsService } from '@contexts/inventory/application/services/write/assert-inventory-item-exists/assert-inventory-item-exists.service';
import { DispatchInventoryLowStockNotificationService } from '@contexts/inventory/application/services/write/dispatch-inventory-low-stock-notification/dispatch-inventory-low-stock-notification.service';
import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemNotFoundException } from '@contexts/inventory/domain/exceptions/inventory-item-not-found.exception';
import { IInventoryItemWriteRepository } from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryItemNameValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-name/inventory-item-name.value-object';
import { InventoryItemTypeValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-type/inventory-item-type.value-object';
import { InventoryLowStockThresholdValueObject } from '@contexts/inventory/domain/value-objects/inventory-low-stock-threshold/inventory-low-stock-threshold.value-object';
import { InventoryQuantityValueObject } from '@contexts/inventory/domain/value-objects/inventory-quantity/inventory-quantity.value-object';
import { InventoryUnitValueObject } from '@contexts/inventory/domain/value-objects/inventory-unit/inventory-unit.value-object';
import { AdjustInventoryItemQuantityCommand } from './adjust-inventory-item-quantity.command';
import { AdjustInventoryItemQuantityCommandHandler } from './adjust-inventory-item-quantity.handler';

const ID = '550e8400-e29b-41d4-a716-446655440000';

function buildItem(
  quantity: number,
  lowStockThreshold: number | null = null,
): InventoryItemAggregate {
  return new InventoryItemAggregate({
    id: new InventoryItemIdValueObject(ID),
    itemType: new InventoryItemTypeValueObject(
      InventoryItemTypeEnum.FERTILIZER,
    ),
    name: new InventoryItemNameValueObject('Tomato fertilizer'),
    brand: null,
    notes: null,
    quantity: new InventoryQuantityValueObject(quantity),
    unit: new InventoryUnitValueObject(InventoryUnitEnum.L),
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

describe('AdjustInventoryItemQuantityCommandHandler', () => {
  let handler: AdjustInventoryItemQuantityCommandHandler;
  let mockWriteRepo: jest.Mocked<IInventoryItemWriteRepository>;
  let mockAssert: jest.Mocked<AssertInventoryItemExistsService>;
  let mockDispatchInventoryLowStockNotificationService: jest.Mocked<DispatchInventoryLowStockNotificationService>;
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

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new AdjustInventoryItemQuantityCommandHandler(
      mockWriteRepo,
      mockAssert,
      mockDispatchInventoryLowStockNotificationService,
      mockEventBus,
    );
  });

  it('consumes stock and saves', async () => {
    const item = buildItem(10);
    mockAssert.execute.mockResolvedValue(item);

    await handler.execute(
      new AdjustInventoryItemQuantityCommand({
        id: ID,
        delta: -3,
        reason: 'sowed',
      }),
    );

    expect(item.quantity.value).toBe(7);
    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
  });

  it('clamps to zero on over-consumption', async () => {
    const item = buildItem(2);
    mockAssert.execute.mockResolvedValue(item);

    await handler.execute(
      new AdjustInventoryItemQuantityCommand({
        id: ID,
        delta: -5,
        reason: 'used all',
      }),
    );

    expect(item.quantity.value).toBe(0);
  });

  it('propagates not found', async () => {
    mockAssert.execute.mockRejectedValue(
      new InventoryItemNotFoundException(ID),
    );

    await expect(
      handler.execute(
        new AdjustInventoryItemQuantityCommand({
          id: ID,
          delta: 1,
          reason: 'restock',
        }),
      ),
    ).rejects.toBeInstanceOf(InventoryItemNotFoundException);
  });

  it('dispatches the low-stock status via DispatchInventoryLowStockNotificationService after adjusting', async () => {
    const item = buildItem(10, 5);
    mockAssert.execute.mockResolvedValue(item);

    await handler.execute(
      new AdjustInventoryItemQuantityCommand({
        id: ID,
        delta: -7,
        reason: 'sowed',
      }),
    );

    expect(
      mockDispatchInventoryLowStockNotificationService.dispatch,
    ).toHaveBeenCalledWith(item);
  });
});
