import { QueryBus } from '@nestjs/cqrs';
import { Criteria } from '@sisques-labs/nestjs-kit';

import { UserFindByCriteriaQuery } from '@contexts/users/application/queries/user-find-by-criteria/user-find-by-criteria.query';
import { UserFindByCriteriaMcpTool } from './user-find-by-criteria.tool';

describe('UserFindByCriteriaMcpTool', () => {
  let tool: UserFindByCriteriaMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new UserFindByCriteriaMcpTool(queryBus);
  });

  it('dispatches UserFindByCriteriaQuery without pagination when args are omitted', async () => {
    const viewModel = { data: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({});

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(UserFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as UserFindByCriteriaQuery;
    expect(query.criteria).toBeInstanceOf(Criteria);
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('dispatches UserFindByCriteriaQuery with pagination when page and perPage are provided', async () => {
    queryBus.execute.mockResolvedValueOnce({ data: [], total: 0 });

    await tool.execute({ page: 2, perPage: 10 });

    const query = queryBus.execute.mock.calls[0][0] as UserFindByCriteriaQuery;
    expect(query.criteria.pagination).toEqual({ page: 2, perPage: 10 });
  });
});
