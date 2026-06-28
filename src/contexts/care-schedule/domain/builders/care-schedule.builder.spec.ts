import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleBuilder } from './care-schedule.builder';

function seed(builder: CareScheduleBuilder): CareScheduleBuilder {
  const now = new Date();
  return builder
    .withId('550e8400-e29b-41d4-a716-446655440000')
    .withPlantId('110e8400-e29b-41d4-a716-446655440010')
    .withActivityType(CareScheduleActivityTypeEnum.WATERING)
    .withIntervalDays(3)
    .withNextDueAt(now)
    .withUserId('660e8400-e29b-41d4-a716-446655440001')
    .withSpaceId('770e8400-e29b-41d4-a716-446655440002')
    .withCreatedAt(now)
    .withUpdatedAt(now);
}

describe('CareScheduleBuilder', () => {
  it('builds a valid aggregate with defaults (active=true, optionals null)', () => {
    const aggregate = seed(new CareScheduleBuilder()).build();
    expect(aggregate.active.value).toBe(true);
    expect(aggregate.quantity).toBeNull();
    expect(aggregate.unit).toBeNull();
    expect(aggregate.notes).toBeNull();
    expect(aggregate.lastCompletedAt).toBeNull();
  });

  it('builds a view model', () => {
    const vm = seed(new CareScheduleBuilder()).buildViewModel();
    expect(vm.plantId).toBe('110e8400-e29b-41d4-a716-446655440010');
    expect(vm.intervalDays).toBe(3);
    expect(vm.active).toBe(true);
  });

  it('throws when plantId is missing', () => {
    const builder = new CareScheduleBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withActivityType(CareScheduleActivityTypeEnum.WATERING)
      .withIntervalDays(3)
      .withNextDueAt(new Date())
      .withUserId('660e8400-e29b-41d4-a716-446655440001')
      .withSpaceId('770e8400-e29b-41d4-a716-446655440002')
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date());
    expect(() => builder.build()).toThrow();
  });

  it('throws when intervalDays is below one', () => {
    const builder = seed(new CareScheduleBuilder()).withIntervalDays(0);
    expect(() => builder.build()).toThrow();
  });

  it('builds a one-time schedule when intervalDays is null', () => {
    const aggregate = seed(new CareScheduleBuilder())
      .withIntervalDays(null)
      .build();
    expect(aggregate.intervalDays).toBeNull();
  });
});
