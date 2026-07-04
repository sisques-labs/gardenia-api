import { validate } from 'class-validator';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { UpdateCareScheduleGraphQLDto } from './update-care-schedule-graphql.dto';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('UpdateCareScheduleGraphQLDto', () => {
  it('passes with only id', async () => {
    const dto = new UpdateCareScheduleGraphQLDto();
    dto.id = SCHEDULE_ID;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes with all fields set', async () => {
    const dto = new UpdateCareScheduleGraphQLDto();
    dto.id = SCHEDULE_ID;
    dto.activityType = CareScheduleActivityTypeEnum.PRUNING;
    dto.intervalDays = 5;
    dto.quantity = 100;
    dto.unit = CareScheduleUnitEnum.ML;
    dto.notes = 'Trim dead leaves';
    dto.active = false;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when id is missing', async () => {
    const dto = new UpdateCareScheduleGraphQLDto();
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'id')).toBe(true);
  });

  it('fails when activityType is invalid', async () => {
    const dto = new UpdateCareScheduleGraphQLDto();
    dto.id = SCHEDULE_ID;
    (dto as any).activityType = 'INVALID';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'activityType')).toBe(true);
  });

  it('fails when intervalDays is below 1', async () => {
    const dto = new UpdateCareScheduleGraphQLDto();
    dto.id = SCHEDULE_ID;
    dto.intervalDays = 0;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'intervalDays')).toBe(true);
  });

  it('fails when quantity is below the minimum', async () => {
    const dto = new UpdateCareScheduleGraphQLDto();
    dto.id = SCHEDULE_ID;
    dto.quantity = 0;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  it('fails when notes exceeds max length', async () => {
    const dto = new UpdateCareScheduleGraphQLDto();
    dto.id = SCHEDULE_ID;
    dto.notes = 'a'.repeat(2001);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'notes')).toBe(true);
  });
});
