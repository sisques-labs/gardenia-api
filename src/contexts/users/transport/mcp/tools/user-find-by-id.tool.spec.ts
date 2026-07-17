import { QueryBus } from '@nestjs/cqrs';

import { UserFindByIdQuery } from '@contexts/users/application/queries/user-find-by-id/user-find-by-id.query';
import { UserFindByIdMcpTool } from './user-find-by-id.tool';

const USER_ID = '22222222-2222-4222-8222-222222222222';

describe('UserFindByIdMcpTool', () => {
  let tool: UserFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new UserFindByIdMcpTool(queryBus);
  });

  it('dispatches UserFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: USER_ID, username: 'gardener' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ id: USER_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(UserFindByIdQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as UserFindByIdQuery;
    expect(query.id.value).toBe(USER_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when the user is not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ id: USER_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
