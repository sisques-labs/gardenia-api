import { QueryBus } from '@nestjs/cqrs';

import { InventoryItemFindByIdQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-id/inventory-item-find-by-id.query';
import { InventoryItemFindByIdMcpTool } from './inventory-item-find-by-id.tool';

const ITEM_ID = '11111111-1111-4111-8111-111111111111';

describe('InventoryItemFindByIdMcpTool', () => {
  let tool: InventoryItemFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new InventoryItemFindByIdMcpTool(queryBus);
  });

  it('dispatches InventoryItemFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: ITEM_ID, name: 'Tomato seeds' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ id: ITEM_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(InventoryItemFindByIdQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as InventoryItemFindByIdQuery;
    expect(query.id.value).toBe(ITEM_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when the inventory item is not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ id: ITEM_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
