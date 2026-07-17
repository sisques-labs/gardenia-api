import { QueryBus } from '@nestjs/cqrs';

import { GbifSpeciesSearchQuery } from '@contexts/plant-species/application/queries/gbif-species-search/gbif-species-search.query';
import { PlantSpeciesSearchMcpTool } from './plant-species-search.tool';

describe('PlantSpeciesSearchMcpTool', () => {
  let tool: PlantSpeciesSearchMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new PlantSpeciesSearchMcpTool(queryBus);
  });

  it('dispatches GbifSpeciesSearchQuery with the default limit', async () => {
    const viewModel = [
      { gbifKey: 2882337, scientificName: 'Monstera deliciosa' },
    ];
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ name: 'Monstera' });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(GbifSpeciesSearchQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as GbifSpeciesSearchQuery;
    expect(query.name).toBe('Monstera');
    expect(query.limit).toBe(10);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('dispatches GbifSpeciesSearchQuery with a custom limit', async () => {
    queryBus.execute.mockResolvedValueOnce([]);

    await tool.execute({ name: 'Ficus', limit: 5 });

    const query = queryBus.execute.mock.calls[0][0] as GbifSpeciesSearchQuery;
    expect(query.limit).toBe(5);
  });
});
