import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { ICareScheduleReadRepository } from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleFindByCriteriaQuery } from './care-schedule-find-by-criteria.query';
import { CareScheduleFindByCriteriaQueryHandler } from './care-schedule-find-by-criteria.handler';

describe('CareScheduleFindByCriteriaQueryHandler', () => {
  let handler: CareScheduleFindByCriteriaQueryHandler;
  let mockReadRepo: jest.Mocked<ICareScheduleReadRepository>;

  beforeEach(() => {
    mockReadRepo = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ICareScheduleReadRepository>;
    handler = new CareScheduleFindByCriteriaQueryHandler(mockReadRepo);
  });

  it('delegates to the read repository', async () => {
    const paginated = new PaginatedResult<CareScheduleViewModel>([], 0, 1, 20);
    mockReadRepo.findByCriteria.mockResolvedValue(paginated);

    const result = await handler.execute(
      new CareScheduleFindByCriteriaQuery(new Criteria()),
    );

    expect(mockReadRepo.findByCriteria).toHaveBeenCalledTimes(1);
    expect(result).toBe(paginated);
  });
});
