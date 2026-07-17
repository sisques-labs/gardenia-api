import { QueryBus } from '@nestjs/cqrs';
import { FilterOperator } from '@sisques-labs/nestjs-kit';

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

  it('dispatches FileFindByCriteriaQuery with default filters and pagination when no args are given', async () => {
    const viewModel = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({});

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(FileFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as FileFindByCriteriaQuery;
    expect(query.criteria.filters).toEqual([]);
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('builds filters for mimeType and filename and applies pagination when provided', async () => {
    queryBus.execute.mockResolvedValueOnce({ items: [], total: 0 });

    await tool.execute({
      mimeType: FileMimeTypeEnum.IMAGE_PNG,
      filename: 'sunset',
      page: 2,
      perPage: 25,
    });

    const query = queryBus.execute.mock.calls[0][0] as FileFindByCriteriaQuery;
    expect(query.criteria.filters).toEqual([
      {
        field: 'mime_type',
        operator: FilterOperator.EQUALS,
        value: FileMimeTypeEnum.IMAGE_PNG,
      },
      {
        field: 'filename',
        operator: FilterOperator.LIKE,
        value: 'sunset',
      },
    ]);
    expect(query.criteria.pagination).toEqual({ page: 2, perPage: 25 });
  });
});
