import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';
import { CareScheduleNotFoundException } from '@contexts/care-schedule/domain/exceptions/care-schedule-not-found.exception';
import { ICareScheduleWriteRepository } from '@contexts/care-schedule/domain/repositories/write/care-schedule-write.repository';
import { CareScheduleIdValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-id/care-schedule-id.value-object';

import { AssertCareScheduleExistsService } from './assert-care-schedule-exists.service';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('AssertCareScheduleExistsService', () => {
  let service: AssertCareScheduleExistsService;
  let writeRepository: jest.Mocked<ICareScheduleWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ICareScheduleWriteRepository>;

    service = new AssertCareScheduleExistsService(writeRepository);
  });

  describe('care schedule exists', () => {
    it('returns the aggregate when found', async () => {
      const aggregate = {
        id: { value: SCHEDULE_ID },
      } as unknown as CareScheduleAggregate;
      const id = new CareScheduleIdValueObject(SCHEDULE_ID);
      writeRepository.findById.mockResolvedValue(aggregate);

      const result = await service.execute(id);

      expect(result).toBe(aggregate);
      expect(writeRepository.findById).toHaveBeenCalledWith(SCHEDULE_ID);
    });
  });

  describe('care schedule does not exist', () => {
    it('throws CareScheduleNotFoundException when not found', async () => {
      writeRepository.findById.mockResolvedValue(null);

      await expect(
        service.execute(new CareScheduleIdValueObject(SCHEDULE_ID)),
      ).rejects.toThrow(CareScheduleNotFoundException);
    });

    it('includes the schedule id in the thrown exception', async () => {
      writeRepository.findById.mockResolvedValue(null);

      await expect(
        service.execute(new CareScheduleIdValueObject(SCHEDULE_ID)),
      ).rejects.toThrow(SCHEDULE_ID);
    });
  });
});
