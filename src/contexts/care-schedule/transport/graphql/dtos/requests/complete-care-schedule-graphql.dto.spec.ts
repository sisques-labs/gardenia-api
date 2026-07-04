import { validate } from 'class-validator';
import { CompleteCareScheduleGraphQLDto } from './complete-care-schedule-graphql.dto';

const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('CompleteCareScheduleGraphQLDto', () => {
  it('passes with only id', async () => {
    const dto = new CompleteCareScheduleGraphQLDto();
    dto.id = SCHEDULE_ID;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes with id and completedAt', async () => {
    const dto = new CompleteCareScheduleGraphQLDto();
    dto.id = SCHEDULE_ID;
    dto.completedAt = new Date('2026-06-27T08:00:00.000Z');
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when id is missing', async () => {
    const dto = new CompleteCareScheduleGraphQLDto();
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'id')).toBe(true);
  });

  it('fails when completedAt is not a date', async () => {
    const dto = new CompleteCareScheduleGraphQLDto();
    dto.id = SCHEDULE_ID;
    (dto as any).completedAt = 'not-a-date';
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'completedAt')).toBe(true);
  });
});
