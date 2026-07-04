import { QueryBus } from '@nestjs/cqrs';

import { FileFindByIdQuery } from '@contexts/files/application/queries/file-find-by-id/file-find-by-id.query';
import { FileFindByIdMcpTool } from './file-find-by-id.tool';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('FileFindByIdMcpTool', () => {
  let tool: FileFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new FileFindByIdMcpTool(queryBus);
  });

  it('exposes its metadata', () => {
    expect(tool.name).toBe('file_find_by_id');
    expect(tool.inputSchema).toHaveProperty('id');
  });

  it('dispatches FileFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: FILE_ID, filename: 'rose.png' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ id: FILE_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(FileFindByIdQuery),
    );
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
