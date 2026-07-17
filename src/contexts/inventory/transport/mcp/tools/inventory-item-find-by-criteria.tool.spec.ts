import { QueryBus } from '@nestjs/cqrs';

import { InventoryItemFindByCriteriaQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.query';
import { InventoryItemFindByCriteriaMcpTool } from './inventory-item-find-by-criteria.tool';

describe('InventoryItemFindByCriteriaMcpTool', () => {
  let tool: InventoryItemFindByCriteriaMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new InventoryItemFindByCriteriaMcpTool(queryBus);
  });

  it('dispatches InventoryItemFindByCriteriaQuery with default pagination when no args are given', async () => {
    const viewModel = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({});

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(InventoryItemFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as InventoryItemFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('applies pagination when page and perPage are provided', async () => {
    queryBus.execute.mockResolvedValueOnce({ items: [], total: 0 });

    await tool.execute({ page: 1, perPage: 15 });

    const query = queryBus.execute.mock
      .calls[0][0] as InventoryItemFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 15 });
  });
});
