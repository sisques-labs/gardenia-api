import { InventoryItemAggregate } from '@contexts/inventory/domain/aggregates/inventory-item.aggregate';
import { InventoryItemNotFoundException } from '@contexts/inventory/domain/exceptions/inventory-item-not-found.exception';
import { IInventoryItemWriteRepository } from '@contexts/inventory/domain/repositories/write/inventory-item-write.repository';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { AssertInventoryItemExistsService } from './assert-inventory-item-exists.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertInventoryItemExistsService', () => {
  let service: AssertInventoryItemExistsService;
  let writeRepository: jest.Mocked<IInventoryItemWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    writeRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IInventoryItemWriteRepository>;
    service = new AssertInventoryItemExistsService(writeRepository);
  });

  it('returns the aggregate when it exists', async () => {
    const aggregate = {} as InventoryItemAggregate;
    writeRepository.findById.mockResolvedValue(aggregate);

    const result = await service.execute(new InventoryItemIdValueObject(ID));

    expect(result).toBe(aggregate);
    expect(writeRepository.findById).toHaveBeenCalledWith(ID);
  });

  it('throws InventoryItemNotFoundException when it does not exist', async () => {
    writeRepository.findById.mockResolvedValue(null);

    await expect(
      service.execute(new InventoryItemIdValueObject(ID)),
    ).rejects.toThrow(InventoryItemNotFoundException);
  });
});
