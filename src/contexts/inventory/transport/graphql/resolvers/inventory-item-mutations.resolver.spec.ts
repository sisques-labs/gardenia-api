import { CommandBus } from '@nestjs/cqrs';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { AdjustInventoryItemQuantityCommand } from '@contexts/inventory/application/commands/adjust-inventory-item-quantity/adjust-inventory-item-quantity.command';
import { CreateInventoryItemCommand } from '@contexts/inventory/application/commands/create-inventory-item/create-inventory-item.command';
import { DeleteInventoryItemCommand } from '@contexts/inventory/application/commands/delete-inventory-item/delete-inventory-item.command';
import { DeleteInventoryItemsBulkCommand } from '@contexts/inventory/application/commands/delete-inventory-items-bulk/delete-inventory-items-bulk.command';
import { UpdateInventoryItemCommand } from '@contexts/inventory/application/commands/update-inventory-item/update-inventory-item.command';
import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { InventoryItemMutationsResolver } from './inventory-item-mutations.resolver';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const ITEM_ID = '550e8400-e29b-41d4-a716-446655440000';
const user = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
} as CurrentUserPayload;

describe('InventoryItemMutationsResolver', () => {
  let sut: InventoryItemMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mapper: jest.Mocked<MutationResponseGraphQLMapper>;
  let spaceContext: jest.Mocked<SpaceContext>;
  const response = { success: true } as MutationResponseDto;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mapper = {
      toResponseDto: jest.fn().mockReturnValue(response),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;
    spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as unknown as jest.Mocked<SpaceContext>;
    sut = new InventoryItemMutationsResolver(commandBus, mapper, spaceContext);
  });

  it('inventoryItemCreate() resolves the space and dispatches CreateInventoryItemCommand', async () => {
    commandBus.execute.mockResolvedValue(ITEM_ID);

    const result = await sut.inventoryItemCreate(
      {
        itemType: InventoryItemTypeEnum.FERTILIZER,
        name: 'Fertilizer',
        quantity: 10,
        unit: InventoryUnitEnum.KG,
      } as never,
      user,
    );

    expect(spaceContext.require).toHaveBeenCalledTimes(1);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateInventoryItemCommand),
    );
    expect(result).toBe(response);
  });

  it('inventoryItemUpdate() dispatches UpdateInventoryItemCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await sut.inventoryItemUpdate({ id: ITEM_ID } as never);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdateInventoryItemCommand),
    );
  });

  it('inventoryItemAdjustQuantity() dispatches AdjustInventoryItemQuantityCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await sut.inventoryItemAdjustQuantity({
      id: ITEM_ID,
      delta: -2,
      reason: 'used',
    } as never);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(AdjustInventoryItemQuantityCommand),
    );
  });

  it('inventoryItemDelete() dispatches DeleteInventoryItemCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await sut.inventoryItemDelete(ITEM_ID);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteInventoryItemCommand),
    );
  });

  it('inventoryItemsDeleteBulk() dispatches DeleteInventoryItemsBulkCommand and reports counts', async () => {
    commandBus.execute.mockResolvedValue({
      deletedIds: [ITEM_ID],
      notFoundIds: [],
    });

    const result = await sut.inventoryItemsDeleteBulk({
      ids: [ITEM_ID],
    } as never);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeleteInventoryItemsBulkCommand),
    );
    expect(result).toEqual({
      deletedIds: [ITEM_ID],
      notFoundIds: [],
      deletedCount: 1,
      requestedCount: 1,
    });
  });
});
