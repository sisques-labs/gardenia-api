import { CommandBus } from '@nestjs/cqrs';

import { UpdateInventoryItemCommand } from '@contexts/inventory/application/commands/update-inventory-item/update-inventory-item.command';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { InventoryItemUpdateMcpTool } from './inventory-item-update.tool';

const ITEM_ID = '11111111-1111-4111-8111-111111111111';

describe('InventoryItemUpdateMcpTool', () => {
  let tool: InventoryItemUpdateMcpTool;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    tool = new InventoryItemUpdateMcpTool(commandBus);
  });

  it('dispatches UpdateInventoryItemCommand with the provided fields', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    const result = await tool.execute({
      id: ITEM_ID,
      itemType: InventoryItemTypeEnum.SUBSTRATE,
      name: 'Coco coir',
      brand: 'GreenGrow',
      notes: 'Rehydrate before use',
      unit: InventoryUnitEnum.L,
      lowStockThreshold: 2,
      acquiredAt: '2026-01-10T00:00:00.000Z',
      expiresAt: '2027-01-10T00:00:00.000Z',
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateInventoryItemCommand),
    );
    const command = commandBus.execute.mock
      .calls[0][0] as UpdateInventoryItemCommand;
    expect(command.id.value).toBe(ITEM_ID);
    expect(command.itemType?.value).toBe(InventoryItemTypeEnum.SUBSTRATE);
    expect(command.name?.value).toBe('Coco coir');
    expect(command.brand?.value).toBe('GreenGrow');
    expect(command.notes?.value).toBe('Rehydrate before use');
    expect(command.unit?.value).toBe(InventoryUnitEnum.L);
    expect(command.lowStockThreshold?.value).toBe(2);
    expect(command.acquiredAt?.value).toEqual(
      new Date('2026-01-10T00:00:00.000Z'),
    );
    expect(command.expiresAt?.value).toEqual(
      new Date('2027-01-10T00:00:00.000Z'),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify({ success: true, id: ITEM_ID }),
    });
  });

  it('leaves optional fields undefined when not provided and nulls them when explicitly null', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);

    await tool.execute({
      id: ITEM_ID,
      brand: null,
      notes: null,
      lowStockThreshold: null,
      acquiredAt: null,
      expiresAt: null,
    });

    const command = commandBus.execute.mock
      .calls[0][0] as UpdateInventoryItemCommand;
    expect(command.itemType).toBeUndefined();
    expect(command.name).toBeUndefined();
    expect(command.unit).toBeUndefined();
    expect(command.brand).toBeNull();
    expect(command.notes).toBeNull();
    expect(command.lowStockThreshold).toBeNull();
    expect(command.acquiredAt).toBeNull();
    expect(command.expiresAt).toBeNull();
  });
});
