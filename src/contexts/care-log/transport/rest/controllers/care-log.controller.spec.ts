import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CreateCareLogEntryCommand } from '@contexts/care-log/application/commands/create-care-log-entry/create-care-log-entry.command';
import { DeleteCareLogEntryCommand } from '@contexts/care-log/application/commands/delete-care-log-entry/delete-care-log-entry.command';
import { UpdateCareLogEntryCommand } from '@contexts/care-log/application/commands/update-care-log-entry/update-care-log-entry.command';
import { CareLogFindByCriteriaQuery } from '@contexts/care-log/application/queries/care-log-find-by-criteria/care-log-find-by-criteria.query';
import { AssertCareLogEntryViewModelExistsService } from '@contexts/care-log/application/services/read/assert-care-log-entry-view-model-exists/assert-care-log-entry-view-model-exists.service';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { CareLogRestMapper } from '../mappers/care-log/care-log.mapper';
import { CareLogController } from './care-log.controller';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const ENTRY_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440000';
const user = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
} as CurrentUserPayload;

describe('CareLogController', () => {
  let controller: CareLogController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let assertExists: jest.Mocked<AssertCareLogEntryViewModelExistsService>;
  let mapper: jest.Mocked<CareLogRestMapper>;
  let spaceContext: jest.Mocked<SpaceContext>;
  const dto = { id: ENTRY_ID } as never;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    assertExists = {
      execute: jest.fn().mockResolvedValue({} as CareLogEntryViewModel),
    } as unknown as jest.Mocked<AssertCareLogEntryViewModelExistsService>;
    mapper = {
      toResponse: jest.fn().mockReturnValue(dto),
    } as unknown as jest.Mocked<CareLogRestMapper>;
    spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as unknown as jest.Mocked<SpaceContext>;
    controller = new CareLogController(
      commandBus,
      queryBus,
      assertExists,
      mapper,
      spaceContext,
    );
  });

  describe('createCareLogEntry()', () => {
    it('dispatches the create command, reloads the entry and maps it', async () => {
      commandBus.execute.mockResolvedValue(ENTRY_ID);

      const result = await controller.createCareLogEntry(
        {
          plantId: PLANT_ID,
          activityType: 'WATERING',
          performedAt: new Date(),
        } as never,
        user,
      );

      expect(spaceContext.require).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateCareLogEntryCommand),
      );
      expect(assertExists.execute).toHaveBeenCalledWith(ENTRY_ID);
      expect(result).toBe(dto);
    });
  });

  describe('careLogEntriesByPlant()', () => {
    it('queries by criteria and maps each item', async () => {
      queryBus.execute.mockResolvedValue(
        new PaginatedResult([{} as CareLogEntryViewModel], 1, 1, 20),
      );

      const result = await controller.careLogEntriesByPlant(PLANT_ID);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(CareLogFindByCriteriaQuery),
      );
      expect(result).toEqual([dto]);
    });
  });

  describe('careLogEntryFindById()', () => {
    it('asserts existence and maps the entry', async () => {
      const result = await controller.careLogEntryFindById(ENTRY_ID);

      expect(assertExists.execute).toHaveBeenCalledWith(ENTRY_ID);
      expect(result).toBe(dto);
    });
  });

  describe('updateCareLogEntry()', () => {
    it('dispatches the update command and returns the reloaded entry', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const result = await controller.updateCareLogEntry(
        ENTRY_ID,
        {} as never,
        user,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateCareLogEntryCommand),
      );
      expect(result).toBe(dto);
    });
  });

  describe('deleteCareLogEntry()', () => {
    it('dispatches the delete command', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.deleteCareLogEntry(ENTRY_ID, user);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteCareLogEntryCommand),
      );
    });
  });
});
