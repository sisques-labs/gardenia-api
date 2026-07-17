import { QueryBus } from '@nestjs/cqrs';

import { CareScheduleFindByCriteriaQuery } from '@contexts/care-schedule/application/queries/care-schedule-find-by-criteria/care-schedule-find-by-criteria.query';
import { CareScheduleFindByCriteriaMcpTool } from './care-schedule-find-by-criteria.tool';

describe('CareScheduleFindByCriteriaMcpTool', () => {
  let tool: CareScheduleFindByCriteriaMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new CareScheduleFindByCriteriaMcpTool(queryBus);
  });

  it('dispatches the query without pagination when page/perPage are absent', async () => {
    const viewModel = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({});

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(CareScheduleFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as CareScheduleFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('dispatches the query with pagination when page and perPage are provided', async () => {
    const viewModel = { items: [{ id: '1' }], total: 1 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    await tool.execute({ page: 3, perPage: 25 });

    const query = queryBus.execute.mock
      .calls[0][0] as CareScheduleFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 3, perPage: 25 });
  });
});
