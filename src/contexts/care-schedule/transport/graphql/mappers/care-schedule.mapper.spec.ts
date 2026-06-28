import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleGraphQLMapper } from './care-schedule.mapper';

describe('CareScheduleGraphQLMapper', () => {
  const mapper = new CareScheduleGraphQLMapper();

  const vm = new CareScheduleViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    plantId: '110e8400-e29b-41d4-a716-446655440010',
    activityType: 'WATERING',
    intervalDays: 3,
    quantity: null,
    unit: null,
    notes: null,
    nextDueAt: new Date('2026-06-27T00:00:00.000Z'),
    lastCompletedAt: null,
    active: true,
    userId: '660e8400-e29b-41d4-a716-446655440001',
    spaceId: '770e8400-e29b-41d4-a716-446655440002',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('maps a view model to a response dto', () => {
    const dto = mapper.toResponseDto(vm);
    expect(dto.id).toBe(vm.id);
    expect(dto.intervalDays).toBe(3);
    expect(dto.active).toBe(true);
  });

  it('maps a paginated result', () => {
    const paginated = new PaginatedResult<CareScheduleViewModel>(
      [vm],
      1,
      1,
      20,
    );
    const dto = mapper.toPaginatedResponseDto(paginated);
    expect(dto.items).toHaveLength(1);
    expect(dto.total).toBe(1);
  });
});
