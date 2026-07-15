import { QueryBus } from '@nestjs/cqrs';

import { GbifSpeciesSearchQuery } from '@contexts/plant-species/application/queries/gbif-species-search/gbif-species-search.query';
import { PlantSpeciesAdapter } from './plant-species.adapter';

describe('PlantSpeciesAdapter', () => {
  let queryBus: jest.Mocked<QueryBus>;
  let adapter: PlantSpeciesAdapter;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    adapter = new PlantSpeciesAdapter(queryBus);
  });

  it('search() dispatches GbifSpeciesSearchQuery and maps the result', async () => {
    queryBus.execute.mockResolvedValue([
      { gbifKey: 2882337, scientificName: 'Monstera deliciosa' },
    ]);

    const result = await adapter.search('Monstera deliciosa', 1);

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(GbifSpeciesSearchQuery),
    );
    expect(result).toEqual([
      { gbifKey: 2882337, scientificName: 'Monstera deliciosa' },
    ]);
  });

  it('returns an empty array when GBIF has no match', async () => {
    queryBus.execute.mockResolvedValue([]);

    const result = await adapter.search('Unknown plantus', 1);

    expect(result).toEqual([]);
  });
});
