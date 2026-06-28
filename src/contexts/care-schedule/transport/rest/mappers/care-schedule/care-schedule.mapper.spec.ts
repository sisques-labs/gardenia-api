import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleRestMapper } from './care-schedule.mapper';

describe('CareScheduleRestMapper', () => {
  const mapper = new CareScheduleRestMapper();

  it('maps a view model to a rest response dto', () => {
    const vm = new CareScheduleViewModel({
      id: '550e8400-e29b-41d4-a716-446655440000',
      plantId: '110e8400-e29b-41d4-a716-446655440010',
      activityType: 'FERTILIZING',
      intervalDays: 14,
      quantity: 250,
      unit: 'ML',
      notes: 'Liquid feed',
      nextDueAt: new Date('2026-07-01T00:00:00.000Z'),
      lastCompletedAt: null,
      active: true,
      userId: '660e8400-e29b-41d4-a716-446655440001',
      spaceId: '770e8400-e29b-41d4-a716-446655440002',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const dto = mapper.toResponse(vm);
    expect(dto.id).toBe(vm.id);
    expect(dto.activityType).toBe('FERTILIZING');
    expect(dto.quantity).toBe(250);
    expect(dto.unit).toBe('ML');
  });
});
