import { IGbifSpeciesSearchPort } from '@contexts/plant-species/application/ports/gbif-species-search.port';

import { GbifSpeciesSearchQuery } from './gbif-species-search.query';
import { GbifSpeciesSearchQueryHandler } from './gbif-species-search.handler';

describe('GbifSpeciesSearchQueryHandler', () => {
  let handler: GbifSpeciesSearchQueryHandler;
  let port: jest.Mocked<IGbifSpeciesSearchPort>;

  beforeEach(() => {
    jest.clearAllMocks();
    port = { suggest: jest.fn() } as jest.Mocked<IGbifSpeciesSearchPort>;
    handler = new GbifSpeciesSearchQueryHandler(port);
  });

  it('returns matches from the port', async () => {
    port.suggest.mockResolvedValue([
      { gbifKey: 2882337, scientificName: 'Monstera deliciosa' },
    ]);

    const result = await handler.execute(
      new GbifSpeciesSearchQuery({ name: 'Monstera' }),
    );

    expect(result).toEqual([
      { gbifKey: 2882337, scientificName: 'Monstera deliciosa' },
    ]);
    expect(port.suggest).toHaveBeenCalledWith('Monstera', 10);
  });

  it('returns an empty list when the port finds nothing', async () => {
    port.suggest.mockResolvedValue([]);

    const result = await handler.execute(
      new GbifSpeciesSearchQuery({ name: 'zzzznonsense' }),
    );

    expect(result).toEqual([]);
  });

  it('clamps the limit to the maximum', async () => {
    port.suggest.mockResolvedValue([]);

    await handler.execute(
      new GbifSpeciesSearchQuery({ name: 'Monstera', limit: 500 }),
    );

    expect(port.suggest).toHaveBeenCalledWith('Monstera', 20);
  });
});
