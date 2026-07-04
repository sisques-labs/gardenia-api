import { QueryBus } from '@nestjs/cqrs';

import { FileFindByCriteriaQuery } from '@contexts/files/application/queries/file-find-by-criteria/file-find-by-criteria.query';
import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileListMcpTool } from './file-list.tool';

describe('FileListMcpTool', () => {
  let tool: FileListMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new FileListMcpTool(queryBus);
  });

  it('exposes its metadata', () => {
    expect(tool.name).toBe('file_list');
    expect(tool.inputSchema).toHaveProperty('mimeType');
  });

  it('dispatches FileFindByCriteriaQuery with no filters and no pagination by default', async () => {
    const paginatedResult = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(paginatedResult);

    const result = await tool.execute({});

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(FileFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as FileFindByCriteriaQuery;
    expect(query.criteria.filters).toEqual([]);
    // Criteria defaults pagination to { page: 1, perPage: 10 } when the tool
    // passes `undefined` (no explicit page/perPage in the input).
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(paginatedResult),
    });
  });

  it('applies mimeType, filename filters and pagination when provided', async () => {
    queryBus.execute.mockResolvedValueOnce({ items: [], total: 0 });

    await tool.execute({
      mimeType: FileMimeTypeEnum.IMAGE_PNG,
      filename: 'rose',
      page: 2,
      perPage: 10,
    });

    const query = queryBus.execute.mock.calls[0][0] as FileFindByCriteriaQuery;
    expect(query.criteria.filters).toHaveLength(2);
    expect(query.criteria.pagination).toEqual({ page: 2, perPage: 10 });
  });

  it('falls back to the Criteria default pagination when only page is provided', async () => {
    queryBus.execute.mockResolvedValueOnce({ items: [], total: 0 });

    await tool.execute({ page: 2 });

    const query = queryBus.execute.mock.calls[0][0] as FileFindByCriteriaQuery;
    // page alone is not enough — the tool requires both page AND perPage to
    // build pagination, so it passes `undefined` and Criteria applies its
    // own default instead of { page: 2 }.
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
  });
});
