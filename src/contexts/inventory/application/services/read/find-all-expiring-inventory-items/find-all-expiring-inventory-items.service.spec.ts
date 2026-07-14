import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { IInventoryItemReadRepository } from '@contexts/inventory/domain/repositories/read/inventory-item-read.repository';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { FindAllExpiringInventoryItemsService } from './find-all-expiring-inventory-items.service';

function buildExpiringItem(id: string): InventoryItemViewModel {
  return new InventoryItemViewModel({
    id,
    itemType: InventoryItemTypeEnum.SEEDS,
    name: 'Lettuce seeds',
    brand: null,
    notes: null,
    quantity: 5,
    unit: InventoryUnitEnum.PACKETS,
    lowStockThreshold: null,
    acquiredAt: null,
    expiresAt: new Date(),
    userId: '660e8400-e29b-41d4-a716-446655440001',
    spaceId: '770e8400-e29b-41d4-a716-446655440002',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('FindAllExpiringInventoryItemsService', () => {
  let mockInventoryItemReadRepository: jest.Mocked<IInventoryItemReadRepository>;
  let service: FindAllExpiringInventoryItemsService;

  beforeEach(() => {
    mockInventoryItemReadRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IInventoryItemReadRepository>;

    service = new FindAllExpiringInventoryItemsService(
      mockInventoryItemReadRepository,
    );
  });

  it('returns the expiring items for a single page', async () => {
    const item = buildExpiringItem('990e8400-e29b-41d4-a716-446655440010');
    mockInventoryItemReadRepository.findByCriteria.mockResolvedValue(
      new PaginatedResult([item], 1, 1, 100),
    );

    const result = await service.execute({ expiringBefore: new Date() });

    expect(result).toEqual([item]);
  });

  it('returns an empty array when there are no expiring items', async () => {
    mockInventoryItemReadRepository.findByCriteria.mockResolvedValue(
      new PaginatedResult([], 0, 1, 100),
    );

    const result = await service.execute({ expiringBefore: new Date() });

    expect(result).toEqual([]);
  });

  it('paginates through every page of expiring items', async () => {
    const first = buildExpiringItem('990e8400-e29b-41d4-a716-446655440010');
    const second = buildExpiringItem('990e8400-e29b-41d4-a716-446655440011');
    mockInventoryItemReadRepository.findByCriteria
      .mockResolvedValueOnce(
        new PaginatedResult(new Array(100).fill(first), 101, 1, 100),
      )
      .mockResolvedValueOnce(new PaginatedResult([second], 101, 2, 100));

    const result = await service.execute({ expiringBefore: new Date() });

    expect(
      mockInventoryItemReadRepository.findByCriteria,
    ).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(101);
  });
});
