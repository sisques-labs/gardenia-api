import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { IInventoryItemReadRepository } from '@contexts/inventory/domain/repositories/read/inventory-item-read.repository';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { InventoryItemFindByCriteriaQuery } from './inventory-item-find-by-criteria.query';
import { InventoryItemFindByCriteriaQueryHandler } from './inventory-item-find-by-criteria.handler';

describe('InventoryItemFindByCriteriaQueryHandler', () => {
  let handler: InventoryItemFindByCriteriaQueryHandler;
  let mockReadRepo: jest.Mocked<IInventoryItemReadRepository>;

  beforeEach(() => {
    mockReadRepo = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IInventoryItemReadRepository>;

    handler = new InventoryItemFindByCriteriaQueryHandler(mockReadRepo);
  });

  it('delegates the criteria to the read repository', async () => {
    const empty = new PaginatedResult<InventoryItemViewModel>([], 0, 1, 20);
    mockReadRepo.findByCriteria.mockResolvedValue(empty);

    const criteria = new Criteria([], undefined, undefined);
    const result = await handler.execute(
      new InventoryItemFindByCriteriaQuery(criteria),
    );

    expect(mockReadRepo.findByCriteria).toHaveBeenCalledWith(criteria);
    expect(result.items).toEqual([]);
  });
});
