import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CompleteCareScheduleDto } from './complete-care-schedule.dto';

describe('CompleteCareScheduleDto', () => {
  it('passes when completedAt is omitted', async () => {
    const dto = new CompleteCareScheduleDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('transforms a plain completedAt string into a Date instance', () => {
    const dto = plainToInstance(CompleteCareScheduleDto, {
      completedAt: '2026-06-27T08:00:00.000Z',
    });
    expect(dto.completedAt).toBeInstanceOf(Date);
  });

  it('passes with a valid completedAt date', async () => {
    const dto = new CompleteCareScheduleDto();
    dto.completedAt = new Date('2026-06-27T08:00:00.000Z');
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when completedAt is not a date', async () => {
    const dto = new CompleteCareScheduleDto();
    (dto as any).completedAt = 'not-a-date';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
