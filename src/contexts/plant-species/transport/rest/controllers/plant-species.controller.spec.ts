import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CreatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/create-plant-species/create-plant-species.command';
import { DeletePlantSpeciesCommand } from '@contexts/plant-species/application/commands/delete-plant-species/delete-plant-species.command';
import { UpdatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/update-plant-species/update-plant-species.command';
import { PlantSpeciesFindByCriteriaQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-criteria/plant-species-find-by-criteria.query';
import { PlantSpeciesFindByIdQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-id/plant-species-find-by-id.query';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { PlantSpeciesRestMapper } from '@contexts/plant-species/transport/rest/mappers/plant-species/plant-species.mapper';
import { PlantSpeciesController } from './plant-species.controller';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantSpeciesController', () => {
  let controller: PlantSpeciesController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<PlantSpeciesRestMapper>;
  const dto = { id: ID } as never;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = {
      execute: jest.fn().mockResolvedValue({} as PlantSpeciesViewModel),
    } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponse: jest.fn().mockReturnValue(dto),
    } as unknown as jest.Mocked<PlantSpeciesRestMapper>;
    controller = new PlantSpeciesController(commandBus, queryBus, mapper);
  });

  describe('createPlantSpecies()', () => {
    it('dispatches the create command and maps the reloaded entry', async () => {
      commandBus.execute.mockResolvedValue(ID);

      const result = await controller.createPlantSpecies({
        scientificName: 'Monstera deliciosa',
      } as never);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreatePlantSpeciesCommand),
      );
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantSpeciesFindByIdQuery),
      );
      expect(result).toBe(dto);
    });
  });

  describe('listPlantSpecies()', () => {
    it('queries by criteria and returns a paginated result', async () => {
      queryBus.execute.mockResolvedValue(
        new PaginatedResult([{} as PlantSpeciesViewModel], 1, 1, 20),
      );

      const result = await controller.listPlantSpecies();

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantSpeciesFindByCriteriaQuery),
      );
      expect(result.items).toEqual([dto]);
      expect(result.total).toBe(1);
    });
  });

  describe('getPlantSpecies()', () => {
    it('queries by id and maps the entry', async () => {
      const result = await controller.getPlantSpecies(ID);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantSpeciesFindByIdQuery),
      );
      expect(result).toBe(dto);
    });
  });

  describe('updatePlantSpecies()', () => {
    it('dispatches the update command and returns the reloaded entry', async () => {
      const result = await controller.updatePlantSpecies(ID, {} as never);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdatePlantSpeciesCommand),
      );
      expect(result).toBe(dto);
    });
  });

  describe('deletePlantSpecies()', () => {
    it('dispatches the delete command', async () => {
      await controller.deletePlantSpecies(ID);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeletePlantSpeciesCommand),
      );
    });
  });
});
