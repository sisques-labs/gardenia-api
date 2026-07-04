import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import {
  CareScheduleResponseDto,
  PaginatedCareSchedulesResultDto,
} from './care-schedule.response.dto';

describe('CareScheduleResponseDto', () => {
  it('holds all fields of a care schedule', () => {
    const now = new Date('2026-06-27T00:00:00.000Z');
    const dto = new CareScheduleResponseDto();
    dto.id = '550e8400-e29b-41d4-a716-446655440000';
    dto.plantId = '110e8400-e29b-41d4-a716-446655440010';
    dto.activityType = CareScheduleActivityTypeEnum.WATERING;
    dto.intervalDays = 3;
    dto.quantity = null;
    dto.unit = null;
    dto.notes = null;
    dto.nextDueAt = now;
    dto.lastCompletedAt = null;
    dto.active = true;
    dto.userId = '660e8400-e29b-41d4-a716-446655440001';
    dto.spaceId = '770e8400-e29b-41d4-a716-446655440002';
    dto.createdAt = now;
    dto.updatedAt = now;

    expect(dto.activityType).toBe(CareScheduleActivityTypeEnum.WATERING);
    expect(dto.intervalDays).toBe(3);
    expect(dto.active).toBe(true);
  });
});

describe('PaginatedCareSchedulesResultDto', () => {
  it('holds a list of care schedule response dtos', () => {
    const dto = new PaginatedCareSchedulesResultDto();
    dto.items = [];
    dto.total = 0;
    dto.page = 1;
    dto.perPage = 20;
    dto.totalPages = 0;

    expect(dto.items).toEqual([]);
  });
});
