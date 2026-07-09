import { CommandBus } from '@nestjs/cqrs';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import { CreatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/create-plant-species/create-plant-species.command';
import { DeletePlantSpeciesCommand } from '@contexts/plant-species/application/commands/delete-plant-species/delete-plant-species.command';
import { EnrichPlantSpeciesCommand } from '@contexts/plant-species/application/commands/enrich-plant-species/enrich-plant-species.command';
import { ImportPlantSpeciesCommand } from '@contexts/plant-species/application/commands/import-plant-species/import-plant-species.command';
import { UpdatePlantSpeciesCommand } from '@contexts/plant-species/application/commands/update-plant-species/update-plant-species.command';
import { PlantSpeciesMutationsResolver } from './plant-species-mutations.resolver';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantSpeciesMutationsResolver', () => {
  let sut: PlantSpeciesMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mapper: jest.Mocked<MutationResponseGraphQLMapper>;
  const response = { success: true } as MutationResponseDto;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mapper = {
      toResponseDto: jest.fn().mockReturnValue(response),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;
    sut = new PlantSpeciesMutationsResolver(commandBus, mapper);
  });

  it('createPlantSpecies() dispatches CreatePlantSpeciesCommand', async () => {
    commandBus.execute.mockResolvedValue(ID);

    const result = await sut.createPlantSpecies({
      scientificName: 'Monstera deliciosa',
    } as never);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreatePlantSpeciesCommand),
    );
    expect(result).toBe(response);
  });

  it('updatePlantSpecies() dispatches UpdatePlantSpeciesCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await sut.updatePlantSpecies({ id: ID } as never);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UpdatePlantSpeciesCommand),
    );
  });

  it('deletePlantSpecies() dispatches DeletePlantSpeciesCommand', async () => {
    commandBus.execute.mockResolvedValue(undefined);

    await sut.deletePlantSpecies({ id: ID } as never);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(DeletePlantSpeciesCommand),
    );
  });

  describe('enrichPlantSpecies()', () => {
    it('returns a success response with id when enrichment succeeds', async () => {
      commandBus.execute.mockResolvedValue(ID);

      await sut.enrichPlantSpecies({ scientificName: 'Monstera' } as never);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(EnrichPlantSpeciesCommand),
      );
      expect(mapper.toResponseDto).toHaveBeenCalledWith(
        expect.objectContaining({ id: ID }),
      );
    });

    it('returns a no-data success response when nothing is found', async () => {
      commandBus.execute.mockResolvedValue(null);

      await sut.enrichPlantSpecies({ scientificName: 'Unknown' } as never);

      expect(mapper.toResponseDto).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'No enrichment data found for the provided scientific name',
        }),
      );
    });
  });

  describe('importPlantSpecies()', () => {
    it('returns the import result directly from the command bus', async () => {
      const importResult = { imported: 5, skipped: 1 };
      commandBus.execute.mockResolvedValue(importResult);

      const result = await sut.importPlantSpecies({
        limit: 10,
        offset: 0,
      } as never);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ImportPlantSpeciesCommand),
      );
      expect(result).toBe(importResult);
    });
  });
});
