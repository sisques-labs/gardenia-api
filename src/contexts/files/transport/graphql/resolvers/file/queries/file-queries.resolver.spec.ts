import { QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { FileFindByCriteriaQuery } from '@contexts/files/application/queries/file-find-by-criteria/file-find-by-criteria.query';
import { FileFindByIdQuery } from '@contexts/files/application/queries/file-find-by-id/file-find-by-id.query';
import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileGraphQLMapper } from '@contexts/files/transport/graphql/mappers/file/file.mapper';
import { FileQueriesResolver } from './file-queries.resolver';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('FileQueriesResolver', () => {
  let resolver: FileQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<FileGraphQLMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDto: jest.fn().mockReturnValue({ id: FILE_ID }),
      toPaginatedResponseDto: jest.fn().mockReturnValue({ items: [] }),
    } as unknown as jest.Mocked<FileGraphQLMapper>;

    resolver = new FileQueriesResolver(queryBus, mapper);
  });

  describe('filesFindByCriteria()', () => {
    it('dispatches with no filters and no pagination when input is undefined', async () => {
      const paginated = new PaginatedResult<FileViewModel>([], 0, 1, 20);
      queryBus.execute.mockResolvedValue(paginated);

      await resolver.filesFindByCriteria(undefined);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(FileFindByCriteriaQuery),
      );
      const query = queryBus.execute.mock
        .calls[0][0] as FileFindByCriteriaQuery;
      expect(query.criteria.filters).toEqual([]);
      expect(mapper.toPaginatedResponseDto).toHaveBeenCalledWith(paginated);
    });

    it('applies mimeType and filename filters when provided', async () => {
      const paginated = new PaginatedResult<FileViewModel>([], 0, 1, 20);
      queryBus.execute.mockResolvedValue(paginated);

      await resolver.filesFindByCriteria({
        mimeType: FileMimeTypeEnum.IMAGE_PNG,
        filename: 'rose',
        page: 2,
        limit: 10,
      } as never);

      const query = queryBus.execute.mock
        .calls[0][0] as FileFindByCriteriaQuery;
      expect(query.criteria.filters).toHaveLength(2);
      expect(query.criteria.pagination).toEqual({ page: 2, perPage: 10 });
    });

    it('defaults pagination when only page is provided', async () => {
      const paginated = new PaginatedResult<FileViewModel>([], 0, 1, 20);
      queryBus.execute.mockResolvedValue(paginated);

      await resolver.filesFindByCriteria({ page: 3 } as never);

      const query = queryBus.execute.mock
        .calls[0][0] as FileFindByCriteriaQuery;
      expect(query.criteria.pagination).toEqual({ page: 3, perPage: 20 });
    });

    it('defaults page to 1 when only limit is provided', async () => {
      const paginated = new PaginatedResult<FileViewModel>([], 0, 1, 5);
      queryBus.execute.mockResolvedValue(paginated);

      await resolver.filesFindByCriteria({ limit: 5 } as never);

      const query = queryBus.execute.mock
        .calls[0][0] as FileFindByCriteriaQuery;
      expect(query.criteria.pagination).toEqual({ page: 1, perPage: 5 });
    });
  });

  describe('fileFindById()', () => {
    it('maps the result when found', async () => {
      const vm = {} as FileViewModel;
      queryBus.execute.mockResolvedValue(vm);

      const result = await resolver.fileFindById({ id: FILE_ID } as never);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(FileFindByIdQuery),
      );
      expect(mapper.toResponseDto).toHaveBeenCalledWith(vm);
      expect(result).toEqual({ id: FILE_ID });
    });

    it('returns null when not found', async () => {
      queryBus.execute.mockResolvedValue(null);

      const result = await resolver.fileFindById({ id: FILE_ID } as never);

      expect(result).toBeNull();
      expect(mapper.toResponseDto).not.toHaveBeenCalled();
    });
  });
});
