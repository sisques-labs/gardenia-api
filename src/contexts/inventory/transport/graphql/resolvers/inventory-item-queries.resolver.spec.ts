import { QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { InventoryItemFindByCriteriaQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.query';
import { InventoryItemFindByIdQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-id/inventory-item-find-by-id.query';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { InventoryItemGraphQLMapper } from '@contexts/inventory/transport/graphql/mappers/inventory-item.mapper';
import { InventoryItemQueriesResolver } from './inventory-item-queries.resolver';

const ITEM_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('InventoryItemQueriesResolver', () => {
  let sut: InventoryItemQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<InventoryItemGraphQLMapper>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDto: jest.fn().mockReturnValue({ id: ITEM_ID }),
      toPaginatedResponseDto: jest.fn().mockReturnValue({ items: [] }),
    } as unknown as jest.Mocked<InventoryItemGraphQLMapper>;
    sut = new InventoryItemQueriesResolver(queryBus, mapper);
  });

  describe('inventoryItemsFindByCriteria()', () => {
    it('dispatches the criteria query and maps the paginated result', async () => {
      const paginated = new PaginatedResult<InventoryItemViewModel>(
        [],
        0,
        1,
        10,
      );
      queryBus.execute.mockResolvedValue(paginated);

      await sut.inventoryItemsFindByCriteria(undefined);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(InventoryItemFindByCriteriaQuery),
      );
      expect(mapper.toPaginatedResponseDto).toHaveBeenCalledWith(paginated);
    });
  });

  describe('inventoryItemFindById()', () => {
    it('maps the result when found', async () => {
      const vm = {} as InventoryItemViewModel;
      queryBus.execute.mockResolvedValue(vm);

      const result = await sut.inventoryItemFindById({ id: ITEM_ID } as never);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(InventoryItemFindByIdQuery),
      );
      expect(mapper.toResponseDto).toHaveBeenCalledWith(vm);
      expect(result).toEqual({ id: ITEM_ID });
    });

    it('returns null when not found', async () => {
      queryBus.execute.mockResolvedValue(null);

      const result = await sut.inventoryItemFindById({ id: ITEM_ID } as never);

      expect(result).toBeNull();
      expect(mapper.toResponseDto).not.toHaveBeenCalled();
    });
  });
});
