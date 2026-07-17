import { CommandBus } from '@nestjs/cqrs';

import { AdjustInventoryItemQuantityCommand } from '@contexts/inventory/application/commands/adjust-inventory-item-quantity/adjust-inventory-item-quantity.command';
import { InventoryItemAdjustQuantityMcpTool } from './inventory-item-adjust-quantity.tool';

const ITEM_ID = '11111111-1111-4111-8111-111111111111';

describe('InventoryItemAdjustQuantityMcpTool', () => {
  let tool: InventoryItemAdjustQuantityMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new InventoryItemAdjustQuantityMcpTool(commandBus);
  });

  it('dispatches AdjustInventoryItemQuantityCommand with id, delta and reason', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({
      id: ITEM_ID,
      delta: -3,
      reason: 'Used for potting',
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(AdjustInventoryItemQuantityCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as AdjustInventoryItemQuantityCommand;
    expect(command.id.value).toBe(ITEM_ID);
    expect(command.delta.value).toBe(-3);
    expect(command.reason.value).toBe('Used for potting');
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: ITEM_ID }),
    });
  });
});
