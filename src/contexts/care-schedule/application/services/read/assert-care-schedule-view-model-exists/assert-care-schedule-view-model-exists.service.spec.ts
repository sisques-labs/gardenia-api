import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleNotFoundException } from '@contexts/care-schedule/domain/exceptions/care-schedule-not-found.exception';
import { ICareScheduleReadRepository } from '@contexts/care-schedule/domain/repositories/read/care-schedule-read.repository';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';

import { AssertCareScheduleViewModelExistsService } from './assert-care-schedule-view-model-exists.service';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2026-01-01');

const buildViewModel = (): CareScheduleViewModel =>
  new CareScheduleViewModel({
    id: SCHEDULE_ID,
    plantId: '110e8400-e29b-41d4-a716-446655440010',
    activityType: CareScheduleActivityTypeEnum.WATERING,
    intervalDays: 3,
    quantity: null,
    unit: null,
    notes: null,
    nextDueAt: NOW,
    lastCompletedAt: null,
    active: true,
    userId: '660e8400-e29b-41d4-a716-446655440001',
    spaceId: '770e8400-e29b-41d4-a716-446655440002',
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('AssertCareScheduleViewModelExistsService', () => {
  let service: AssertCareScheduleViewModelExistsService;
  let readRepository: jest.Mocked<ICareScheduleReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ICareScheduleReadRepository>;

    service = new AssertCareScheduleViewModelExistsService(readRepository);
  });

  describe('care schedule exists', () => {
    it('returns the view model when found', async () => {
      const vm = buildViewModel();
      readRepository.findById.mockResolvedValue(vm);

      const result = await service.execute(
        new CareScheduleIdValueObject(SCHEDULE_ID),
      );

      expect(result).toBe(vm);
      expect(readRepository.findById).toHaveBeenCalledWith(SCHEDULE_ID);
    });
  });

  describe('care schedule does not exist', () => {
    it('throws CareScheduleNotFoundException when not found', async () => {
      readRepository.findById.mockResolvedValue(null);

      await expect(
        service.execute(new CareScheduleIdValueObject(SCHEDULE_ID)),
      ).rejects.toThrow(CareScheduleNotFoundException);
    });

    it('includes the schedule id in the thrown exception', async () => {
      readRepository.findById.mockResolvedValue(null);

      await expect(
        service.execute(new CareScheduleIdValueObject(SCHEDULE_ID)),
      ).rejects.toThrow(SCHEDULE_ID);
    });
  });
});
