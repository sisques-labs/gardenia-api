import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CreateHarvestCommand } from '@contexts/harvests/application/commands/create-harvest/create-harvest.command';
import { DeleteHarvestCommand } from '@contexts/harvests/application/commands/delete-harvest/delete-harvest.command';
import { UpdateHarvestCommand } from '@contexts/harvests/application/commands/update-harvest/update-harvest.command';
import { HarvestFindByCriteriaQuery } from '@contexts/harvests/application/queries/harvest-find-by-criteria/harvest-find-by-criteria.query';
import { HarvestFindByIdQuery } from '@contexts/harvests/application/queries/harvest-find-by-id/harvest-find-by-id.query';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { HarvestRestMapper } from '../mappers/harvest/harvest.mapper';
import { HarvestsController } from './harvests.controller';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const HARVEST_ID = '550e8400-e29b-41d4-a716-446655440000';
const user = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
} as CurrentUserPayload;

describe('HarvestsController', () => {
  let controller: HarvestsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<HarvestRestMapper>;
  const dto = { id: HARVEST_ID } as never;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = {
      execute: jest.fn().mockResolvedValue({} as HarvestViewModel),
    } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponse: jest.fn().mockReturnValue(dto),
    } as unknown as jest.Mocked<HarvestRestMapper>;
    controller = new HarvestsController(commandBus, queryBus, mapper);
  });

  describe('createHarvest()', () => {
    it('dispatches the create command with the header space id and maps the reloaded harvest', async () => {
      commandBus.execute.mockResolvedValue(HARVEST_ID);

      const result = await controller.createHarvest(
        {
          cropType: 'Tomato',
          quantity: 2.5,
          unit: 'KG',
          harvestedAt: new Date(),
        } as never,
        user,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateHarvestCommand),
      );
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(HarvestFindByIdQuery),
      );
      expect(result).toBe(dto);
    });
  });

  describe('harvestsFindByCriteria()', () => {
    it('queries by criteria and maps the paginated result', async () => {
      queryBus.execute.mockResolvedValue(
        new PaginatedResult([{} as HarvestViewModel], 1, 1, 20),
      );

      const result = await controller.harvestsFindByCriteria();

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(HarvestFindByCriteriaQuery),
      );
      expect(result.items).toEqual([dto]);
      expect(result.total).toBe(1);
    });
  });

  describe('harvestFindById()', () => {
    it('queries by id and maps the harvest', async () => {
      const result = await controller.harvestFindById(HARVEST_ID);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(HarvestFindByIdQuery),
      );
      expect(result).toBe(dto);
    });
  });

  describe('updateHarvest()', () => {
    it('dispatches the update command and returns the reloaded harvest', async () => {
      const result = await controller.updateHarvest(HARVEST_ID, {} as never);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateHarvestCommand),
      );
      expect(result).toBe(dto);
    });
  });

  describe('deleteHarvest()', () => {
    it('dispatches the delete command and returns success', async () => {
      const result = await controller.deleteHarvest(HARVEST_ID);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteHarvestCommand),
      );
      expect(result).toEqual({ success: true });
    });
  });
});
