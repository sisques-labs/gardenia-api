import { AssertInventoryItemViewModelExistsService } from '@contexts/inventory/application/services/read/assert-inventory-item-view-model-exists/assert-inventory-item-view-model-exists.service';
import { InventoryItemNotFoundException } from '@contexts/inventory/domain/exceptions/inventory-item-not-found.exception';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { InventoryItemFindByIdQuery } from './inventory-item-find-by-id.query';
import { InventoryItemFindByIdQueryHandler } from './inventory-item-find-by-id.handler';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('InventoryItemFindByIdQueryHandler', () => {
  let handler: InventoryItemFindByIdQueryHandler;
  let mockAssert: jest.Mocked<AssertInventoryItemViewModelExistsService>;

  beforeEach(() => {
    mockAssert = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertInventoryItemViewModelExistsService>;

    handler = new InventoryItemFindByIdQueryHandler(mockAssert);
  });

  it('returns the view model when found', async () => {
    const vm = { id: ID } as InventoryItemViewModel;
    mockAssert.execute.mockResolvedValue(vm);

    const result = await handler.execute(
      new InventoryItemFindByIdQuery({ id: ID }),
    );

    expect(result).toBe(vm);
  });

  it('propagates not found', async () => {
    mockAssert.execute.mockRejectedValue(
      new InventoryItemNotFoundException(ID),
    );

    await expect(
      handler.execute(new InventoryItemFindByIdQuery({ id: ID })),
    ).rejects.toBeInstanceOf(InventoryItemNotFoundException);
  });
});
