import { CareScheduleBuilder } from '@contexts/care-schedule/domain/builders/care-schedule.builder';
import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';
import { CareScheduleTypeOrmEntity } from '../entities/care-schedule.entity';
import { CareScheduleTypeOrmMapper } from './care-schedule-typeorm.mapper';

describe('CareScheduleTypeOrmMapper', () => {
  const mapper = new CareScheduleTypeOrmMapper(new CareScheduleBuilder());

  function buildEntity(): CareScheduleTypeOrmEntity {
    const entity = new CareScheduleTypeOrmEntity();
    entity.id = '550e8400-e29b-41d4-a716-446655440000';
    entity.plantId = '110e8400-e29b-41d4-a716-446655440010';
    entity.activityType = CareScheduleActivityTypeEnum.FERTILIZING;
    entity.intervalDays = 14;
    entity.quantity = '250.000';
    entity.unit = CareScheduleUnitEnum.ML;
    entity.notes = 'Liquid feed';
    entity.nextDueAt = new Date('2026-07-01T00:00:00.000Z');
    entity.lastCompletedAt = null;
    entity.active = true;
    entity.userId = '660e8400-e29b-41d4-a716-446655440001';
    entity.spaceId = '770e8400-e29b-41d4-a716-446655440002';
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    return entity;
  }

  it('maps entity → domain → persistence round-trip', () => {
    const aggregate = mapper.toDomain(buildEntity());
    expect(aggregate.intervalDays?.value).toBe(14);
    expect(aggregate.quantity?.value).toBe(250);

    const persisted = mapper.toPersistence(aggregate);
    expect(persisted.quantity).toBe('250');
    expect(persisted.activityType).toBe(
      CareScheduleActivityTypeEnum.FERTILIZING,
    );
    expect(persisted.unit).toBe(CareScheduleUnitEnum.ML);
  });

  it('maps entity → view model', () => {
    const vm = mapper.toViewModel(buildEntity());
    expect(vm.plantId).toBe('110e8400-e29b-41d4-a716-446655440010');
    expect(vm.quantity).toBe(250);
    expect(vm.active).toBe(true);
  });

  it('handles null optional fields', () => {
    const entity = buildEntity();
    entity.quantity = null;
    entity.unit = null;
    entity.notes = null;
    const aggregate = mapper.toDomain(entity);
    expect(aggregate.quantity).toBeNull();
    expect(aggregate.unit).toBeNull();
    expect(aggregate.notes).toBeNull();
  });

  it('persists a null quantity as null (not "0" or "null" string)', () => {
    const entity = buildEntity();
    entity.quantity = null;
    const aggregate = mapper.toDomain(entity);

    const persisted = mapper.toPersistence(aggregate);

    expect(persisted.quantity).toBeNull();
  });

  it('maps a one-time schedule with null interval_days', () => {
    const entity = buildEntity();
    entity.intervalDays = null;
    const aggregate = mapper.toDomain(entity);
    expect(aggregate.intervalDays).toBeNull();

    const persisted = mapper.toPersistence(aggregate);
    expect(persisted.intervalDays).toBeNull();
  });
});
