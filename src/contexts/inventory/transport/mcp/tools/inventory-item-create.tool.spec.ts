import { CommandBus } from '@nestjs/cqrs';

import { CreateInventoryItemCommand } from '@contexts/inventory/application/commands/create-inventory-item/create-inventory-item.command';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { InventoryItemCreateMcpTool } from './inventory-item-create.tool';

const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('InventoryItemCreateMcpTool', () => {
  let tool: InventoryItemCreateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new InventoryItemCreateMcpTool(commandBus);
  });

  it('dispatches CreateInventoryItemCommand with userId and spaceId from the context', async () => {
    commandBus.execute.mockResolvedValueOnce('item-id');

    const result = await tool.execute(
      {
        itemType: InventoryItemTypeEnum.SEEDS,
        name: 'Tomato seeds',
        quantity: 10,
        unit: InventoryUnitEnum.PACKETS,
      },
      CONTEXT,
    );

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateInventoryItemCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as CreateInventoryItemCommand;
    expect(command.itemType.value).toBe(InventoryItemTypeEnum.SEEDS);
    expect(command.name.value).toBe('Tomato seeds');
    expect(command.quantity.value).toBe(10);
    expect(command.unit.value).toBe(InventoryUnitEnum.PACKETS);
    expect(command.userId.value).toBe(CONTEXT.userId);
    expect(command.spaceId.value).toBe(CONTEXT.spaceId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: 'item-id' }),
    });
  });

  it('defaults optional fields to null when not provided', async () => {
    commandBus.execute.mockResolvedValueOnce('item-id');

    await tool.execute(
      {
        itemType: InventoryItemTypeEnum.FERTILIZER,
        name: 'NPK Mix',
        quantity: 1,
        unit: InventoryUnitEnum.KG,
      },
      CONTEXT,
    );

    const command = commandBus.execute.mock
      .calls[0][0] as CreateInventoryItemCommand;
    expect(command.brand).toBeNull();
    expect(command.notes).toBeNull();
    expect(command.lowStockThreshold).toBeNull();
    expect(command.acquiredAt).toBeNull();
    expect(command.expiresAt).toBeNull();
  });
});
