import { QueryBus } from '@nestjs/cqrs';

import { PlantingSpotFindByIdQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-id/planting-spot-find-by-id.query';
import { PlantingSpotFindByIdMcpTool } from './planting-spot-find-by-id.tool';

const PLANTING_SPOT_ID = '11111111-1111-4111-8111-111111111111';

describe('PlantingSpotFindByIdMcpTool', () => {
  let tool: PlantingSpotFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new PlantingSpotFindByIdMcpTool(queryBus);
  });

  it('dispatches PlantingSpotFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: PLANTING_SPOT_ID, name: 'Bed 1' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ id: PLANTING_SPOT_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(PlantingSpotFindByIdQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as PlantingSpotFindByIdQuery;
    expect(query.id.value).toBe(PLANTING_SPOT_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when the planting spot is not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ id: PLANTING_SPOT_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
