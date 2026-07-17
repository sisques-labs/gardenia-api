import { QueryBus } from '@nestjs/cqrs';

import { HarvestFindByIdQuery } from '@contexts/harvests/application/queries/harvest-find-by-id/harvest-find-by-id.query';
import { HarvestFindByIdMcpTool } from './harvest-find-by-id.tool';

const HARVEST_ID = '11111111-1111-4111-8111-111111111111';

describe('HarvestFindByIdMcpTool', () => {
  let tool: HarvestFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new HarvestFindByIdMcpTool(queryBus);
  });

  it('dispatches HarvestFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: HARVEST_ID, cropType: 'Tomato' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ id: HARVEST_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(HarvestFindByIdQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as HarvestFindByIdQuery;
    expect(query.id.value).toBe(HARVEST_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when the harvest is not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ id: HARVEST_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
