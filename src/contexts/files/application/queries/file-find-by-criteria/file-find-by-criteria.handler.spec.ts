import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { IFileReadRepository } from '@contexts/files/domain/repositories/read/file-read.repository';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileFindByCriteriaQuery } from './file-find-by-criteria.query';
import { FileFindByCriteriaQueryHandler } from './file-find-by-criteria.handler';

describe('FileFindByCriteriaQueryHandler', () => {
  let handler: FileFindByCriteriaQueryHandler;
  let mockReadRepo: jest.Mocked<IFileReadRepository>;

  beforeEach(() => {
    mockReadRepo = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IFileReadRepository>;
    handler = new FileFindByCriteriaQueryHandler(mockReadRepo);
  });

  it('delegates the criteria to the read repository', async () => {
    const empty = new PaginatedResult<FileViewModel>([], 0, 1, 20);
    mockReadRepo.findByCriteria.mockResolvedValue(empty);

    const criteria = new Criteria([], undefined, undefined);
    const result = await handler.execute(new FileFindByCriteriaQuery(criteria));

    expect(mockReadRepo.findByCriteria).toHaveBeenCalledWith(criteria);
    expect(result.items).toEqual([]);
  });
});
