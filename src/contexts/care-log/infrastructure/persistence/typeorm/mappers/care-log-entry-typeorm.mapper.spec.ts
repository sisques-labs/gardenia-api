import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';
import { CareLogEntryBuilder } from '@contexts/care-log/domain/builders/care-log-entry.builder';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogEntryTypeOrmEntity } from '../entities/care-log-entry.entity';
import { CareLogEntryTypeOrmMapper } from './care-log-entry-typeorm.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');
const PERFORMED_AT = new Date('2026-01-03T00:00:00.000Z');

const buildEntity = (
  overrides: Partial<CareLogEntryTypeOrmEntity> = {},
): CareLogEntryTypeOrmEntity => {
  const entity = new CareLogEntryTypeOrmEntity();
  entity.id = ID;
  entity.plantId = PLANT_ID;
  entity.userId = USER_ID;
  entity.spaceId = SPACE_ID;
  entity.activityType = CareLogActivityTypeEnum.WATERING;
  entity.performedAt = PERFORMED_AT;
  entity.notes = 'Watered well';
  entity.quantity = 500;
  entity.unit = CareLogUnitEnum.ML;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return Object.assign(entity, overrides);
};

describe('CareLogEntryTypeOrmMapper', () => {
  let mapper: CareLogEntryTypeOrmMapper;

  beforeEach(() => {
    mapper = new CareLogEntryTypeOrmMapper(new CareLogEntryBuilder());
  });

  describe('toDomain()', () => {
    it('wraps entity primitives into value objects', () => {
      const result = mapper.toDomain(buildEntity());

      expect(result).toBeInstanceOf(CareLogEntryAggregate);
      expect(result.id.value).toBe(ID);
      expect(result.activityType.value).toBe(CareLogActivityTypeEnum.WATERING);
      expect(result.notes?.value).toBe('Watered well');
      expect(result.quantity?.value).toBe(500);
      expect(result.unit?.value).toBe(CareLogUnitEnum.ML);
    });

    it('maps null optional fields', () => {
      const result = mapper.toDomain(
        buildEntity({ notes: null, quantity: null, unit: null }),
      );

      expect(result.notes).toBeNull();
      expect(result.quantity).toBeNull();
      expect(result.unit).toBeNull();
    });
  });

  describe('toPersistence()', () => {
    it('serializes the aggregate into entity primitives', () => {
      const aggregate = mapper.toDomain(buildEntity());

      const result = mapper.toPersistence(aggregate);

      expect(result).toBeInstanceOf(CareLogEntryTypeOrmEntity);
      expect(result.id).toBe(ID);
      expect(result.quantity).toBe(500);
      expect(result.unit).toBe(CareLogUnitEnum.ML);
    });

    it('serializes null optional fields as null', () => {
      const aggregate = mapper.toDomain(
        buildEntity({ notes: null, quantity: null, unit: null }),
      );

      const result = mapper.toPersistence(aggregate);

      expect(result.notes).toBeNull();
      expect(result.quantity).toBeNull();
      expect(result.unit).toBeNull();
    });
  });

  describe('toViewModel()', () => {
    it('maps entity primitives into a view model', () => {
      const vm = mapper.toViewModel(buildEntity());

      expect(vm.id).toBe(ID);
      expect(vm.activityType).toBe(CareLogActivityTypeEnum.WATERING);
      expect(vm.quantity).toBe(500);
    });
  });
});
