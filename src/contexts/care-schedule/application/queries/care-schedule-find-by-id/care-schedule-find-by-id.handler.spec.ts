import { AssertCareScheduleViewModelExistsService } from '@contexts/care-schedule/application/services/read/assert-care-schedule-view-model-exists/assert-care-schedule-view-model-exists.service';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleFindByIdQuery } from './care-schedule-find-by-id.query';
import { CareScheduleFindByIdQueryHandler } from './care-schedule-find-by-id.handler';

describe('CareScheduleFindByIdQueryHandler', () => {
  let handler: CareScheduleFindByIdQueryHandler;
  let mockAssert: jest.Mocked<AssertCareScheduleViewModelExistsService>;

  beforeEach(() => {
    mockAssert = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertCareScheduleViewModelExistsService>;
    handler = new CareScheduleFindByIdQueryHandler(mockAssert);
  });

  it('returns the view model from the assert service', async () => {
    const vm = {
      id: '550e8400-e29b-41d4-a716-446655440000',
    } as CareScheduleViewModel;
    mockAssert.execute.mockResolvedValue(vm);

    const result = await handler.execute(
      new CareScheduleFindByIdQuery({
        id: '550e8400-e29b-41d4-a716-446655440000',
      }),
    );

    expect(result).toBe(vm);
  });
});
