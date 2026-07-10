import { QueryBus } from '@nestjs/cqrs';

import { GbifSpeciesSearchQuery } from '@contexts/plant-species/application/queries/gbif-species-search/gbif-species-search.query';
import { PlantSpeciesGraphQLMapper } from '@contexts/plant-species/transport/graphql/mappers/plant-species.mapper';

import { GbifSpeciesSearchQueriesResolver } from './gbif-species-search-queries.resolver';

describe('GbifSpeciesSearchQueriesResolver', () => {
  let sut: GbifSpeciesSearchQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: PlantSpeciesGraphQLMapper;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = new PlantSpeciesGraphQLMapper();
    sut = new GbifSpeciesSearchQueriesResolver(queryBus, mapper);
  });

  it('dispatches GbifSpeciesSearchQuery and maps results', async () => {
    queryBus.execute.mockResolvedValue([
      { gbifKey: 2882337, scientificName: 'Monstera deliciosa' },
    ]);

    const result = await sut.gbifSpeciesSearch({ name: 'Monstera' } as never);

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(GbifSpeciesSearchQuery),
    );
    expect(result).toEqual([
      { gbifKey: 2882337, scientificName: 'Monstera deliciosa' },
    ]);
  });

  it('returns an empty array when there are no matches', async () => {
    queryBus.execute.mockResolvedValue([]);

    const result = await sut.gbifSpeciesSearch({ name: 'zzz' } as never);

    expect(result).toEqual([]);
  });
});
