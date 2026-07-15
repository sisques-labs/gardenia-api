import { QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleGraphQLMapper } from '@contexts/care-schedule/transport/graphql/mappers/care-schedule.mapper';
import { CareScheduleQueriesResolver } from './care-schedule-queries.resolver';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('CareScheduleQueriesResolver', () => {
  let sut: CareScheduleQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<CareScheduleGraphQLMapper>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponseDto: jest.fn().mockReturnValue({ id: SCHEDULE_ID }),
      toPaginatedResponseDto: jest
        .fn()
        .mockReturnValue({ items: [], total: 0 }),
    } as unknown as jest.Mocked<CareScheduleGraphQLMapper>;
    sut = new CareScheduleQueriesResolver(queryBus, mapper);
  });

  it('careSchedulesFindByCriteria() maps the paginated result', async () => {
    queryBus.execute.mockResolvedValue(
      new PaginatedResult<CareScheduleViewModel>([], 0, 1, 20),
    );
    await sut.careSchedulesFindByCriteria(undefined);
    expect(mapper.toPaginatedResponseDto).toHaveBeenCalledTimes(1);
  });

  it('careScheduleFindById() returns the mapped dto', async () => {
    queryBus.execute.mockResolvedValue({
      id: SCHEDULE_ID,
    } as CareScheduleViewModel);
    const result = await sut.careScheduleFindById({ id: SCHEDULE_ID });
    expect(result).toEqual({ id: SCHEDULE_ID });
  });

  it('careScheduleFindById() returns null when not found', async () => {
    queryBus.execute.mockResolvedValue(null);
    const result = await sut.careScheduleFindById({ id: SCHEDULE_ID });
    expect(result).toBeNull();
  });
});
