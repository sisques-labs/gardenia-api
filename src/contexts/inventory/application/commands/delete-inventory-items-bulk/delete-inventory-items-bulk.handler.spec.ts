import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { IInventoryItemWriteRepository } from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryItemNameValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-name/inventory-item-name.value-object';
import { InventoryItemTypeValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-type/inventory-item-type.value-object';
import { InventoryQuantityValueObject } from '@contexts/inventory/domain/value-objects/inventory-quantity/inventory-quantity.value-object';
import { InventoryUnitValueObject } from '@contexts/inventory/domain/value-objects/inventory-unit/inventory-unit.value-object';
import { DeleteInventoryItemsBulkCommand } from './delete-inventory-items-bulk.command';
import { DeleteInventoryItemsBulkCommandHandler } from './delete-inventory-items-bulk.handler';

const ID_A = '550e8400-e29b-41d4-a716-446655440000';
const ID_B = '550e8400-e29b-41d4-a716-446655440001';
const ID_C = '550e8400-e29b-41d4-a716-446655440002';

function buildItem(id: string): InventoryItemAggregate {
  return new InventoryItemAggregate({
    id: new InventoryItemIdValueObject(id),
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

describe('DeleteInventoryItemsBulkCommandHandler', () => {
  let handler: DeleteInventoryItemsBulkCommandHandler;
  let mockWriteRepo: jest.Mocked<IInventoryItemWriteRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IInventoryItemWriteRepository>;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new DeleteInventoryItemsBulkCommandHandler(
      mockWriteRepo,
      mockEventBus,
    );
  });

  it('deletes all ids when all exist', async () => {
    mockWriteRepo.findById
      .mockResolvedValueOnce(buildItem(ID_A))
      .mockResolvedValueOnce(buildItem(ID_B));

    const result = await handler.execute(
      new DeleteInventoryItemsBulkCommand({ ids: [ID_A, ID_B] }),
    );

    expect(mockWriteRepo.delete).toHaveBeenCalledWith(ID_A);
    expect(mockWriteRepo.delete).toHaveBeenCalledWith(ID_B);
    expect(result).toEqual({ deletedIds: [ID_A, ID_B], notFoundIds: [] });
  });

  it('splits deleted and not-found ids for a mixed batch', async () => {
    mockWriteRepo.findById
      .mockResolvedValueOnce(buildItem(ID_A))
      .mockResolvedValueOnce(buildItem(ID_B))
      .mockResolvedValueOnce(null);

    const result = await handler.execute(
      new DeleteInventoryItemsBulkCommand({ ids: [ID_A, ID_B, ID_C] }),
    );

    expect(mockWriteRepo.delete).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      deletedIds: [ID_A, ID_B],
      notFoundIds: [ID_C],
    });
  });

  it('reports all ids as not found when none exist', async () => {
    mockWriteRepo.findById.mockResolvedValue(null);

    const result = await handler.execute(
      new DeleteInventoryItemsBulkCommand({ ids: [ID_A, ID_B] }),
    );

    expect(mockWriteRepo.delete).not.toHaveBeenCalled();
    expect(result).toEqual({ deletedIds: [], notFoundIds: [ID_A, ID_B] });
  });

  it('de-duplicates repeated ids and deletes exactly once', async () => {
    mockWriteRepo.findById.mockResolvedValue(buildItem(ID_A));

    const result = await handler.execute(
      new DeleteInventoryItemsBulkCommand({ ids: [ID_A, ID_A, ID_A] }),
    );

    expect(mockWriteRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockWriteRepo.delete).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ deletedIds: [ID_A], notFoundIds: [] });
  });

  it('returns an empty result for an empty batch', async () => {
    const result = await handler.execute(
      new DeleteInventoryItemsBulkCommand({ ids: [] }),
    );

    expect(mockWriteRepo.findById).not.toHaveBeenCalled();
    expect(result).toEqual({ deletedIds: [], notFoundIds: [] });
  });
});
