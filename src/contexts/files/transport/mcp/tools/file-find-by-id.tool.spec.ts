import { QueryBus } from '@nestjs/cqrs';

import { FileFindByIdQuery } from '@contexts/files/application/queries/file-find-by-id/file-find-by-id.query';
import { FileFindByIdMcpTool } from './file-find-by-id.tool';

const FILE_ID = '11111111-1111-4111-8111-111111111111';

describe('FileFindByIdMcpTool', () => {
  let tool: FileFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new FileFindByIdMcpTool(queryBus);
  });

  it('dispatches FileFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: FILE_ID, filename: 'photo.jpg' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ id: FILE_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(FileFindByIdQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as FileFindByIdQuery;
    expect(query.id.value).toBe(FILE_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when the file is not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ id: FILE_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
