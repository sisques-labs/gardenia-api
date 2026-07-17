import { QueryBus } from '@nestjs/cqrs';

import { SpacesFindByUserQuery } from '@contexts/spaces/application/queries/spaces-find-by-user/spaces-find-by-user.query';
import { IMcpToolContext } from '@core/mcp/mcp-context.interface';
import { SpacesFindByUserMcpTool } from './spaces-find-by-user.tool';

const CONTEXT: IMcpToolContext = {
  userId: '33333333-3333-4333-8333-333333333333',
  email: 'gardener@example.com',
  spaceId: '44444444-4444-4444-8444-444444444444',
};

describe('SpacesFindByUserMcpTool', () => {
  let tool: SpacesFindByUserMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new SpacesFindByUserMcpTool(queryBus);
  });

  it('dispatches SpacesFindByUserQuery with userId from the context', async () => {
    const viewModel = [{ id: '44444444-4444-4444-8444-444444444444' }];
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({}, CONTEXT);

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(SpacesFindByUserQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as SpacesFindByUserQuery;
    expect(query.userId.value).toBe(CONTEXT.userId);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });
});
