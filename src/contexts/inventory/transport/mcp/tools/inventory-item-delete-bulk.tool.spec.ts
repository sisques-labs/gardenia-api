import { CommandBus } from '@nestjs/cqrs';

import { DeleteInventoryItemsBulkCommand } from '@contexts/inventory/application/commands/delete-inventory-items-bulk/delete-inventory-items-bulk.command';
import { InventoryItemDeleteBulkMcpTool } from './inventory-item-delete-bulk.tool';

const ITEM_ID_1 = '11111111-1111-4111-8111-111111111111';
const ITEM_ID_2 = '22222222-2222-4222-8222-222222222222';

describe('InventoryItemDeleteBulkMcpTool', () => {
  let tool: InventoryItemDeleteBulkMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new InventoryItemDeleteBulkMcpTool(commandBus);
  });

  it('dispatches DeleteInventoryItemsBulkCommand with the given ids and serializes the result', async () => {
    commandBus.execute.mockResolvedValueOnce({
      deletedIds: [ITEM_ID_1],
      notFoundIds: [ITEM_ID_2],
    });

    const result = await tool.execute({ ids: [ITEM_ID_1, ITEM_ID_2] });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteInventoryItemsBulkCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as DeleteInventoryItemsBulkCommand;
    expect(command.ids.map((id) => id.value)).toEqual([ITEM_ID_1, ITEM_ID_2]);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({
        deletedIds: [ITEM_ID_1],
        notFoundIds: [ITEM_ID_2],
        deletedCount: 1,
        requestedCount: 2,
      }),
    });
  });
});
