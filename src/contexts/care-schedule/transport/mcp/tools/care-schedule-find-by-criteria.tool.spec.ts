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

  it('dispatches with pagination when page and perPage are provided', async () => {
    const paginated = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(paginated);

    const result = await tool.execute({ page: 2, perPage: 10 });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(CareScheduleFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as CareScheduleFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 2, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(paginated),
    });
  });

  it('falls back to the default pagination when page/perPage are omitted', async () => {
    queryBus.execute.mockResolvedValueOnce({ items: [], total: 0 });

    await tool.execute({});

    const query = queryBus.execute.mock
      .calls[0][0] as CareScheduleFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
  });
});
