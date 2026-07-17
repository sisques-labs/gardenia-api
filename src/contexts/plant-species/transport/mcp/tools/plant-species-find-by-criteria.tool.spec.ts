import { QueryBus } from '@nestjs/cqrs';

import { PlantSpeciesFindByCriteriaQuery } from '@contexts/plant-species/application/queries/plant-species-find-by-criteria/plant-species-find-by-criteria.query';
import { PlantSpeciesFindByCriteriaMcpTool } from './plant-species-find-by-criteria.tool';

describe('PlantSpeciesFindByCriteriaMcpTool', () => {
  let tool: PlantSpeciesFindByCriteriaMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new PlantSpeciesFindByCriteriaMcpTool(queryBus);
  });

  it('dispatches PlantSpeciesFindByCriteriaQuery without pagination args', async () => {
    const viewModel = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({});

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(PlantSpeciesFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as PlantSpeciesFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('dispatches PlantSpeciesFindByCriteriaQuery with page and perPage', async () => {
    const viewModel = { items: [{ id: '1' }], total: 1 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    await tool.execute({ page: 3, perPage: 25 });

    const query = queryBus.execute.mock
      .calls[0][0] as PlantSpeciesFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 3, perPage: 25 });
  });
});
