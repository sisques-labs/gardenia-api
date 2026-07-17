import { QueryBus } from '@nestjs/cqrs';

import { HarvestFindByCriteriaQuery } from '@contexts/harvests/application/queries/harvest-find-by-criteria/harvest-find-by-criteria.query';
import { HarvestFindByCriteriaMcpTool } from './harvest-find-by-criteria.tool';

describe('HarvestFindByCriteriaMcpTool', () => {
  let tool: HarvestFindByCriteriaMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new HarvestFindByCriteriaMcpTool(queryBus);
  });

  it('dispatches HarvestFindByCriteriaQuery with default pagination when no args are given', async () => {
    const viewModel = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({});

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(HarvestFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as HarvestFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('applies pagination when page and perPage are provided', async () => {
    queryBus.execute.mockResolvedValueOnce({ items: [], total: 0 });

    await tool.execute({ page: 3, perPage: 20 });

    const query = queryBus.execute.mock
      .calls[0][0] as HarvestFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 3, perPage: 20 });
  });
});
