import { CommandBus } from '@nestjs/cqrs';

import { DeleteInventoryItemCommand } from '@contexts/inventory/application/commands/delete-inventory-item/delete-inventory-item.command';
import { InventoryItemDeleteMcpTool } from './inventory-item-delete.tool';

const ITEM_ID = '11111111-1111-4111-8111-111111111111';

describe('InventoryItemDeleteMcpTool', () => {
  let tool: InventoryItemDeleteMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new InventoryItemDeleteMcpTool(commandBus);
  });

  it('dispatches DeleteInventoryItemCommand with the given id', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({ id: ITEM_ID });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteInventoryItemCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as DeleteInventoryItemCommand;
    expect(command.id.value).toBe(ITEM_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: ITEM_ID }),
    });
  });
});
