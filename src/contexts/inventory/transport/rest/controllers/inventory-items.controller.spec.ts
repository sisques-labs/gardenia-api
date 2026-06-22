import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { AdjustInventoryItemQuantityCommand } from '@contexts/inventory/application/commands/adjust-inventory-item-quantity/adjust-inventory-item-quantity.command';
import { CreateInventoryItemCommand } from '@contexts/inventory/application/commands/create-inventory-item/create-inventory-item.command';
import { DeleteInventoryItemCommand } from '@contexts/inventory/application/commands/delete-inventory-item/delete-inventory-item.command';
import { UpdateInventoryItemCommand } from '@contexts/inventory/application/commands/update-inventory-item/update-inventory-item.command';
import { InventoryItemFindByCriteriaQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-criteria/inventory-item-find-by-criteria.query';
import { InventoryItemFindByIdQuery } from '@contexts/inventory/application/queries/inventory-item-find-by-id/inventory-item-find-by-id.query';
import { InventoryItemViewModel } from '@contexts/inventory/domain/view-models/inventory-item.view-model';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { InventoryItemRestMapper } from '../mappers/inventory-item/inventory-item.mapper';
import { InventoryItemsController } from './inventory-items.controller';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const ITEM_ID = '550e8400-e29b-41d4-a716-446655440000';
const user = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
} as CurrentUserPayload;

describe('InventoryItemsController', () => {
  let controller: InventoryItemsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<InventoryItemRestMapper>;
  const dto = { id: ITEM_ID } as never;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = {
      execute: jest.fn().mockResolvedValue({} as InventoryItemViewModel),
    } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponse: jest.fn().mockReturnValue(dto),
    } as unknown as jest.Mocked<InventoryItemRestMapper>;
    controller = new InventoryItemsController(commandBus, queryBus, mapper);
  });

  describe('createInventoryItem()', () => {
    it('dispatches the create command and maps the reloaded item', async () => {
      commandBus.execute.mockResolvedValue(ITEM_ID);

      const result = await controller.createInventoryItem(
        {
          itemType: 'FERTILIZER',
          name: 'Fertilizer',
          quantity: 10,
          unit: 'KG',
        } as never,
        user,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateInventoryItemCommand),
      );
      expect(result).toBe(dto);
    });
  });

  describe('inventoryItemsFindByCriteria()', () => {
    it('queries by criteria and maps the paginated result', async () => {
      queryBus.execute.mockResolvedValue(
        new PaginatedResult([{} as InventoryItemViewModel], 1, 1, 20),
      );

      const result = await controller.inventoryItemsFindByCriteria();

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(InventoryItemFindByCriteriaQuery),
      );
      expect(result.items).toEqual([dto]);
    });
  });

  describe('inventoryItemFindById()', () => {
    it('queries by id and maps the item', async () => {
      const result = await controller.inventoryItemFindById(ITEM_ID);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(InventoryItemFindByIdQuery),
      );
      expect(result).toBe(dto);
    });
  });

  describe('updateInventoryItem()', () => {
    it('dispatches the update command and returns the reloaded item', async () => {
      const result = await controller.updateInventoryItem(ITEM_ID, {} as never);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateInventoryItemCommand),
      );
      expect(result).toBe(dto);
    });
  });

  describe('adjustInventoryItemQuantity()', () => {
    it('dispatches the adjust command and returns the reloaded item', async () => {
      const result = await controller.adjustInventoryItemQuantity(ITEM_ID, {
        delta: -2,
        reason: 'used in repotting',
      } as never);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(AdjustInventoryItemQuantityCommand),
      );
      expect(result).toBe(dto);
    });
  });

  describe('deleteInventoryItem()', () => {
    it('dispatches the delete command and returns success', async () => {
      const result = await controller.deleteInventoryItem(ITEM_ID);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteInventoryItemCommand),
      );
      expect(result).toEqual({ success: true });
    });
  });
});
