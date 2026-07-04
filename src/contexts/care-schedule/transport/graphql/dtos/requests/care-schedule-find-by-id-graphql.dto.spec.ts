import { validate } from 'class-validator';
import { CareScheduleFindByIdGraphQLDto } from './care-schedule-find-by-id-graphql.dto';

describe('CareScheduleFindByIdGraphQLDto', () => {
  it('passes with a valid uuid', async () => {
    const dto = new CareScheduleFindByIdGraphQLDto();
    dto.id = '550e8400-e29b-41d4-a716-446655440000';
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when id is not a uuid', async () => {
    const dto = new CareScheduleFindByIdGraphQLDto();
    dto.id = 'not-a-uuid';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails when id is empty', async () => {
    const dto = new CareScheduleFindByIdGraphQLDto();
    dto.id = '';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
