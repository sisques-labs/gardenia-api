import { QueryBus } from '@nestjs/cqrs';

import { PlantFindByCriteriaQuery } from '@contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.query';
import { PlantFindByCriteriaMcpTool } from './plant-find-by-criteria.tool';

describe('PlantFindByCriteriaMcpTool', () => {
  let tool: PlantFindByCriteriaMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new PlantFindByCriteriaMcpTool(queryBus);
  });

  it('dispatches PlantFindByCriteriaQuery without pagination args', async () => {
    const viewModel = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({});

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(PlantFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as PlantFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('dispatches PlantFindByCriteriaQuery with page and perPage', async () => {
    const viewModel = { items: [{ id: '1' }], total: 1 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    await tool.execute({ page: 2, perPage: 20 });

    const query = queryBus.execute.mock.calls[0][0] as PlantFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 2, perPage: 20 });
  });
});
