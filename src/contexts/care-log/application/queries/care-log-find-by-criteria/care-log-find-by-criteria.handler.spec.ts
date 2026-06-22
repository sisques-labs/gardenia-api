import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { ICareLogEntryReadRepository } from '@contexts/care-log/domain/repositories/read/care-log-entry-read.repository';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { CareLogFindByCriteriaQuery } from './care-log-find-by-criteria.query';
import { CareLogFindByCriteriaQueryHandler } from './care-log-find-by-criteria.handler';

describe('CareLogFindByCriteriaQueryHandler', () => {
  let handler: CareLogFindByCriteriaQueryHandler;
  let readRepository: jest.Mocked<ICareLogEntryReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<ICareLogEntryReadRepository>;
    handler = new CareLogFindByCriteriaQueryHandler(readRepository);
  });

  it('delegates to the read repository and returns the paginated result', async () => {
    const criteria = {} as Criteria;
    const paginated = new PaginatedResult<CareLogEntryViewModel>([], 0, 1, 10);
    readRepository.findByCriteria.mockResolvedValue(paginated);

    const result = await handler.execute(
      new CareLogFindByCriteriaQuery({ criteria }),
    );

    expect(readRepository.findByCriteria).toHaveBeenCalledWith(criteria);
    expect(result).toBe(paginated);
  });

  it('propagates repository errors', async () => {
    readRepository.findByCriteria.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(
        new CareLogFindByCriteriaQuery({ criteria: {} as Criteria }),
      ),
    ).rejects.toThrow('DB error');
  });
});
