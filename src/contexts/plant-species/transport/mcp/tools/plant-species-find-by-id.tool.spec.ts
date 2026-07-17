import { QueryBus } from '@nestjs/cqrs';

import { PlantSpeciesFindByIdQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-id/plant-species-find-by-id.query';
import { PlantSpeciesFindByIdMcpTool } from './plant-species-find-by-id.tool';

const SPECIES_ID = '11111111-1111-4111-8111-111111111111';

describe('PlantSpeciesFindByIdMcpTool', () => {
  let tool: PlantSpeciesFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new PlantSpeciesFindByIdMcpTool(queryBus);
  });

  it('exposes its metadata', () => {
    expect(tool.name).toBe('plant_species_find_by_id');
    expect(tool.inputSchema).toHaveProperty('plantSpeciesId');
  });

  it('dispatches PlantSpeciesFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: SPECIES_ID, scientificName: 'Monstera deliciosa' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ plantSpeciesId: SPECIES_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(PlantSpeciesFindByIdQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as PlantSpeciesFindByIdQuery;
    expect(query.plantSpeciesId.value).toBe(SPECIES_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when the plant species is not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ plantSpeciesId: SPECIES_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
