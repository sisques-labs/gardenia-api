import { validate } from 'class-validator';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { UpdateCareScheduleDto } from './update-care-schedule.dto';

describe('UpdateCareScheduleDto', () => {
  it('passes when no fields are set', async () => {
    const dto = new UpdateCareScheduleDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes with all fields set', async () => {
    const dto = new UpdateCareScheduleDto();
    dto.activityType = CareScheduleActivityTypeEnum.PRUNING;
    dto.intervalDays = 5;
    dto.quantity = 100;
    dto.unit = CareScheduleUnitEnum.ML;
    dto.notes = 'Trim dead leaves';
    dto.active = false;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when activityType is invalid', async () => {
    const dto = new UpdateCareScheduleDto();
    (dto as any).activityType = 'INVALID';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'activityType')).toBe(true);
  });

  it('fails when intervalDays is below 1', async () => {
    const dto = new UpdateCareScheduleDto();
    dto.intervalDays = 0;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'intervalDays')).toBe(true);
  });

  it('fails when quantity is below the minimum', async () => {
    const dto = new UpdateCareScheduleDto();
    dto.quantity = 0;
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'quantity')).toBe(true);
  });

  it('fails when unit is invalid', async () => {
    const dto = new UpdateCareScheduleDto();
    (dto as any).unit = 'INVALID';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'unit')).toBe(true);
  });

  it('fails when notes exceeds max length', async () => {
    const dto = new UpdateCareScheduleDto();
    dto.notes = 'a'.repeat(2001);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'notes')).toBe(true);
  });

  it('fails when active is not a boolean', async () => {
    const dto = new UpdateCareScheduleDto();
    (dto as any).active = 'yes';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'active')).toBe(true);
  });
});
