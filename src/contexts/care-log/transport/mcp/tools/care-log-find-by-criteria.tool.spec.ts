import { QueryBus } from '@nestjs/cqrs';

import { CareLogFindByCriteriaQuery } from '@contexts/care-log/application/queries/care-log-find-by-criteria/care-log-find-by-criteria.query';
import { CareLogFindByCriteriaMcpTool } from './care-log-find-by-criteria.tool';

describe('CareLogFindByCriteriaMcpTool', () => {
  let tool: CareLogFindByCriteriaMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new CareLogFindByCriteriaMcpTool(queryBus);
  });

  it('dispatches the query without pagination when page/perPage are absent', async () => {
    const viewModel = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({});

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(CareLogFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as CareLogFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('dispatches the query with pagination when page and perPage are provided', async () => {
    const viewModel = { items: [{ id: '1' }], total: 1 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    await tool.execute({ page: 2, perPage: 10 });

    const query = queryBus.execute.mock
      .calls[0][0] as CareLogFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 2, perPage: 10 });
  });
});
