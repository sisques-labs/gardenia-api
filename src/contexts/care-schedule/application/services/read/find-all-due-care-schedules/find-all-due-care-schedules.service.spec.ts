import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { ICareScheduleReadRepository } from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { FindAllDueCareSchedulesService } from './find-all-due-care-schedules.service';

function buildDueSchedule(id: string): CareScheduleViewModel {
  return new CareScheduleViewModel({
    id,
    plantId: '110e8400-e29b-41d4-a716-446655440010',
    activityType: CareScheduleActivityTypeEnum.WATERING,
    intervalDays: 3,
    quantity: null,
    unit: null,
    notes: null,
    nextDueAt: new Date(),
    lastCompletedAt: null,
    active: true,
    userId: '660e8400-e29b-41d4-a716-446655440001',
    spaceId: '770e8400-e29b-41d4-a716-446655440002',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('FindAllDueCareSchedulesService', () => {
  let mockCareScheduleReadRepository: jest.Mocked<ICareScheduleReadRepository>;
  let service: FindAllDueCareSchedulesService;

  beforeEach(() => {
    mockCareScheduleReadRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<ICareScheduleReadRepository>;

    service = new FindAllDueCareSchedulesService(
      mockCareScheduleReadRepository,
    );
  });

  it('returns the due schedules for a single page', async () => {
    const schedule = buildDueSchedule('990e8400-e29b-41d4-a716-446655440010');
    mockCareScheduleReadRepository.findByCriteria.mockResolvedValue(
      new PaginatedResult([schedule], 1, 1, 100),
    );

    const result = await service.execute({ dueBefore: new Date() });

    expect(result).toEqual([schedule]);
  });

  it('returns an empty array when there are no due schedules', async () => {
    mockCareScheduleReadRepository.findByCriteria.mockResolvedValue(
      new PaginatedResult([], 0, 1, 100),
    );

    const result = await service.execute({ dueBefore: new Date() });

    expect(result).toEqual([]);
  });

  it('paginates through every page of due schedules', async () => {
    const first = buildDueSchedule('990e8400-e29b-41d4-a716-446655440010');
    const second = buildDueSchedule('990e8400-e29b-41d4-a716-446655440011');
    mockCareScheduleReadRepository.findByCriteria
      .mockResolvedValueOnce(
        new PaginatedResult(new Array(100).fill(first), 101, 1, 100),
      )
      .mockResolvedValueOnce(new PaginatedResult([second], 101, 2, 100));

    const result = await service.execute({ dueBefore: new Date() });

    expect(mockCareScheduleReadRepository.findByCriteria).toHaveBeenCalledTimes(
      2,
    );
    expect(result).toHaveLength(101);
  });
});
