import { validate } from 'class-validator';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CreateCareScheduleGraphQLDto } from './create-care-schedule-graphql.dto';

const PLANT_ID = '110e8400-e29b-41d4-a716-446655440010';

describe('CreateCareScheduleGraphQLDto', () => {
  it('passes with only required fields', async () => {
    const dto = new CreateCareScheduleGraphQLDto();
    dto.plantId = PLANT_ID;
    dto.activityType = CareScheduleActivityTypeEnum.WATERING;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes with all optional fields set', async () => {
    const dto = new CreateCareScheduleGraphQLDto();
    dto.plantId = PLANT_ID;
    dto.activityType = CareScheduleActivityTypeEnum.FERTILIZING;
    dto.intervalDays = 7;
    dto.quantity = 250;
    dto.unit = CareScheduleUnitEnum.ML;
    dto.notes = 'Deep watering';
    dto.nextDueAt = new Date('2026-06-28T08:00:00.000Z');
    dto.active = true;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when plantId is not a uuid', async () => {
    const dto = new CreateCareScheduleGraphQLDto();
    dto.plantId = 'not-a-uuid';
    dto.activityType = CareScheduleActivityTypeEnum.WATERING;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'plantId')).toBe(true);
  });

  it('fails when activityType is invalid', async () => {
    const dto = new CreateCareScheduleGraphQLDto();
    dto.plantId = PLANT_ID;
    (dto as any).activityType = 'INVALID';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'activityType')).toBe(true);
  });

  it('fails when intervalDays is below 1', async () => {
    const dto = new CreateCareScheduleGraphQLDto();
    dto.plantId = PLANT_ID;
    dto.activityType = CareScheduleActivityTypeEnum.WATERING;
    dto.intervalDays = 0;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'intervalDays')).toBe(true);
  });

  it('fails when quantity is below the minimum', async () => {
    const dto = new CreateCareScheduleGraphQLDto();
    dto.plantId = PLANT_ID;
    dto.activityType = CareScheduleActivityTypeEnum.WATERING;
    dto.quantity = 0;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  it('fails when notes exceeds max length', async () => {
    const dto = new CreateCareScheduleGraphQLDto();
    dto.plantId = PLANT_ID;
    dto.activityType = CareScheduleActivityTypeEnum.WATERING;
    dto.notes = 'a'.repeat(2001);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'notes')).toBe(true);
  });
});
