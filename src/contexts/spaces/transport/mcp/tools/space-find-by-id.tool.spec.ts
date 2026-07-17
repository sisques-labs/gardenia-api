import { QueryBus } from '@nestjs/cqrs';

import { SpaceFindByIdQuery } from '@contexts/spaces/application/queries/space-find-by-id/space-find-by-id.query';
import { SpaceFindByIdMcpTool } from './space-find-by-id.tool';

const SPACE_ID = '44444444-4444-4444-8444-444444444444';

describe('SpaceFindByIdMcpTool', () => {
  let tool: SpaceFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new SpaceFindByIdMcpTool(queryBus);
  });

  it('dispatches SpaceFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: SPACE_ID, name: 'Backyard' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ spaceId: SPACE_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(SpaceFindByIdQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as SpaceFindByIdQuery;
    expect(query.spaceId.value).toBe(SPACE_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when the space is not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ spaceId: SPACE_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
