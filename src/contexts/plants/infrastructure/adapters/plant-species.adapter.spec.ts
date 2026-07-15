import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { PlantSpeciesBuilder } from '@contexts/plants/domain/builders/plant-species.builder';
import { FindOrCreatePlantSpeciesByGbifKeyCommand } from '@contexts/plant-species/application/commands/find-or-create-plant-species-by-gbif-key/find-or-create-plant-species-by-gbif-key.command';
import { PlantSpeciesAdapter } from './plant-species.adapter';

const SPECIES_ID = '880e8400-e29b-41d4-a716-446655440003';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const catalogViewModel = () => ({
  id: SPECIES_ID,
  scientificName: 'Aloe vera',
  gbifKey: 2977863,
  createdAt: NOW,
  updatedAt: NOW,
});

describe('PlantSpeciesAdapter', () => {
  let adapter: PlantSpeciesAdapter;
  let queryBus: jest.Mocked<QueryBus>;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    jest.clearAllMocks();
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    adapter = new PlantSpeciesAdapter(
      queryBus,
      commandBus,
      new PlantSpeciesBuilder(),
    );
  });

  describe('findByPlantSpeciesId', () => {
    it('maps the catalog view model returned by the query bus', async () => {
      queryBus.execute.mockResolvedValue(catalogViewModel());

      const result = await adapter.findByPlantSpeciesId(SPECIES_ID);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(SPECIES_ID);
      expect(result?.scientificName).toBe('Aloe vera');
      expect(result?.gbifKey).toBe(2977863);
    });

    it('returns null when the query resolves to null', async () => {
      queryBus.execute.mockResolvedValue(null);

      expect(await adapter.findByPlantSpeciesId(SPECIES_ID)).toBeNull();
    });

    it('returns null when the query throws', async () => {
      queryBus.execute.mockRejectedValue(new Error('not found'));

      expect(await adapter.findByPlantSpeciesId(SPECIES_ID)).toBeNull();
    });
  });

  describe('findOrCreateByGbifKey', () => {
    it('dispatches FindOrCreatePlantSpeciesByGbifKeyCommand and returns the id', async () => {
      commandBus.execute.mockResolvedValue(SPECIES_ID);

      const result = await adapter.findOrCreateByGbifKey(2977863, 'Aloe vera');

      expect(result).toEqual({ id: SPECIES_ID });
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(FindOrCreatePlantSpeciesByGbifKeyCommand),
      );
    });
  });
});
