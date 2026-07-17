import { QueryBus } from '@nestjs/cqrs';

import { PlantingSpotFindByCriteriaQuery } from '@contexts/planting-spots/application/queries/planting-spot-find-by-criteria/planting-spot-find-by-criteria.query';
import { PlantingSpotFindByCriteriaMcpTool } from './planting-spot-find-by-criteria.tool';

describe('PlantingSpotFindByCriteriaMcpTool', () => {
  let tool: PlantingSpotFindByCriteriaMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new PlantingSpotFindByCriteriaMcpTool(queryBus);
  });

  it('dispatches PlantingSpotFindByCriteriaQuery with default pagination when not provided', async () => {
    const listResult = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(listResult);

    const result = await tool.execute({});

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(PlantingSpotFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as PlantingSpotFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(listResult),
    });
  });

  it('dispatches PlantingSpotFindByCriteriaQuery with pagination when page and perPage are provided', async () => {
    const listResult = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(listResult);

    await tool.execute({ page: 2, perPage: 10 });

    const query = queryBus.execute.mock
      .calls[0][0] as PlantingSpotFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 2, perPage: 10 });
  });
});
