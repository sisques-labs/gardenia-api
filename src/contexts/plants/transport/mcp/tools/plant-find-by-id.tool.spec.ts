import { QueryBus } from '@nestjs/cqrs';

import { PlantFindByIdQuery } from '@contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.query';
import { PlantFindByIdMcpTool } from './plant-find-by-id.tool';

const PLANT_ID = '11111111-1111-4111-8111-111111111111';

describe('PlantFindByIdMcpTool', () => {
  let tool: PlantFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new PlantFindByIdMcpTool(queryBus);
  });

  it('exposes its metadata', () => {
    expect(tool.name).toBe('plant_find_by_id');
    expect(tool.inputSchema).toHaveProperty('id');
  });

  it('dispatches PlantFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: PLANT_ID, name: 'Basil' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ id: PLANT_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(PlantFindByIdQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as PlantFindByIdQuery;
    expect(query.plantId.value).toBe(PLANT_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when the plant is not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ id: PLANT_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
