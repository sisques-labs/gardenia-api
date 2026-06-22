import { InventoryItemNotFoundException } from '@contexts/inventory/domain/exceptions/inventory-item-not-found.exception';
import { IInventoryItemReadRepository } from '@contexts/inventory/domain/repositories/read/inventory-item-read.repository';
import { InventoryItemIdValueObject } from '@contexts/inventory/domain/value-objects/inventory-item-id/inventory-item-id.value-object';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { AssertInventoryItemViewModelExistsService } from './assert-inventory-item-view-model-exists.service';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertInventoryItemViewModelExistsService', () => {
  let service: AssertInventoryItemViewModelExistsService;
  let readRepository: jest.Mocked<IInventoryItemReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IInventoryItemReadRepository>;
    service = new AssertInventoryItemViewModelExistsService(readRepository);
  });

  it('returns the view model when it exists', async () => {
    const vm = {} as InventoryItemViewModel;
    readRepository.findById.mockResolvedValue(vm);

    const result = await service.execute(new InventoryItemIdValueObject(ID));

    expect(result).toBe(vm);
    expect(readRepository.findById).toHaveBeenCalledWith(ID);
  });

  it('throws InventoryItemNotFoundException when it does not exist', async () => {
    readRepository.findById.mockResolvedValue(null);

    await expect(
      service.execute(new InventoryItemIdValueObject(ID)),
    ).rejects.toThrow(InventoryItemNotFoundException);
  });
});
